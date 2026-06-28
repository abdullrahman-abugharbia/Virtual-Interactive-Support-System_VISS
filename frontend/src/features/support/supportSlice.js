import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createSession, fetchSession, closeSession, sendMessageStream } from './supportAPI';
import { fetchItemsByUserIdAsync } from '../cart/cartSlice';
import { router } from '../../app/router';

// ─── Thunks ────────────────────────────────────────────────────────────────

export const initSessionAsync = createAsyncThunk(
  'support/initSession',
  async (guestName, { rejectWithValue }) => {
    try {
      return await createSession(guestName || null);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const loadSessionAsync = createAsyncThunk(
  'support/loadSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      return await fetchSession(sessionId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const closeSessionAsync = createAsyncThunk(
  'support/closeSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      return await closeSession(sessionId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Sends a message and streams the LLM reply back via SSE.
 * Dispatches addStreamingChunk for each token, then finalizeStreamingMessage when done.
 */
export const sendMessageAsync = createAsyncThunk(
  'support/sendMessage',
  async ({ sessionId, message }, { dispatch, rejectWithValue }) => {
    try {
      // Immediately add the user message to state
      dispatch(addMessage({ role: 'user', content: message }));
      dispatch(setAvatarState('thinking'));

      const stream = await sendMessageStream(sessionId, message);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      dispatch(startStreaming());

      let receivedText = false; // did any reply text actually arrive this turn?
      let serverError = null;   // error reported by the backend over the stream

      // Finish the turn: flush the reply, and ONLY enter "speaking" when real text
      // arrived — otherwise the avatar would re-speak the previous (e.g. greeting)
      // message. Surface backend errors instead of silently leaving the turn empty.
      const finishTurn = () => {
        dispatch(finalizeStreamingMessage());
        if (serverError) {
          dispatch(addMessage({
            role: 'assistant',
            content: "Sorry, I ran into a problem and couldn't respond just now. Please try again.",
          }));
          dispatch(setAvatarState('speaking')); // speak it too, don't just type it
        } else {
          dispatch(setAvatarState(receivedText ? 'speaking' : 'idle'));
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            finishTurn();
            return serverError ? rejectWithValue(serverError) : undefined;
          }

          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            continue; // skip malformed SSE lines ONLY — never swallow real events
          }

          if (parsed.error) {
            serverError = parsed.error; // handled when the stream ends
            continue;
          }
          if (parsed.delta) {
            receivedText = true;
            dispatch(addStreamingChunk(parsed.delta));
            continue;
          }
          if (parsed.action === 'cart_updated') {
            dispatch(fetchItemsByUserIdAsync());
          } else if (parsed.action === 'show_product' && parsed.productId) {
            // Aria found a specific product → open its detail page
            router.navigate(`/product-detail/${parsed.productId}`);
          } else if (parsed.action === 'navigate' && parsed.path) {
            // Aria opened a page (home / cart / checkout / orders / profile)
            router.navigate(parsed.path);
          } else if (parsed.action === 'fill_checkout') {
            // Aria pre-filled the checkout shipping form (she never places the order)
            dispatch(
              setRequestedCheckout({
                address: parsed.address || {},
                paymentMethod: parsed.paymentMethod || null,
              })
            );
            router.navigate('/checkout');
          } else if (parsed.action === 'search') {
            // Aria ran a free-text site search → show results on the listing
            router.navigate(parsed.query ? `/?q=${encodeURIComponent(parsed.query)}` : '/');
          } else if (parsed.action === 'apply_filters') {
            // Aria resolved a brand/category/price search → check those filters
            dispatch(
              setRequestedFilters({
                category: parsed.category || [],
                brand: parsed.brand || [],
                minPrice: parsed.minPrice != null ? parsed.minPrice : null,
                maxPrice: parsed.maxPrice != null ? parsed.maxPrice : null,
              })
            );
            router.navigate('/');
          } else if (parsed.action === 'filter_category' && parsed.category) {
            // Backward-compat: single category
            dispatch(setRequestedFilters({ category: [parsed.category], brand: [] }));
            router.navigate('/');
          }
        }
      }

      // Stream ended without an explicit [DONE].
      finishTurn();
      return serverError ? rejectWithValue(serverError) : undefined;
    } catch (err) {
      dispatch(finalizeStreamingMessage());
      dispatch(addMessage({
        role: 'assistant',
        content: "Sorry, I ran into a problem and couldn't respond just now. Please try again.",
      }));
      dispatch(setAvatarState('speaking')); // speak it too, don't just type it
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────

const initialState = {
  sessionId: null,
  messages: [],          // { id, role, content, timestamp }
  streamingContent: '',  // accumulates while LLM is streaming
  isStreaming: false,
  avatarState: 'idle',   // idle | listening | thinking | speaking
  isOpen: false,
  isLoading: false,
  error: null,
  requestedFilters: null, // { category: [], brand: [] } Aria asked the listing to apply
  requestedCheckout: null, // { address, paymentMethod } Aria asked checkout to pre-fill
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    openWidget(state) {
      state.isOpen = true;
    },
    closeWidget(state) {
      state.isOpen = false;
    },
    setAvatarState(state, action) {
      state.avatarState = action.payload;
    },
    addMessage(state, action) {
      state.messages.push({
        id: Date.now().toString(),
        role: action.payload.role,
        content: action.payload.content,
        timestamp: new Date().toISOString(),
      });
    },
    startStreaming(state) {
      state.isStreaming = true;
      state.streamingContent = '';
    },
    addStreamingChunk(state, action) {
      state.streamingContent += action.payload;
    },
    finalizeStreamingMessage(state) {
      if (state.streamingContent) {
        state.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: state.streamingContent,
          timestamp: new Date().toISOString(),
        });
      }
      state.streamingContent = '';
      state.isStreaming = false;
    },
    resetSession(state) {
      state.sessionId = null;
      state.messages = [];
      state.streamingContent = '';
      state.isStreaming = false;
      state.avatarState = 'idle';
      state.error = null;
      state.requestedFilters = null;
      state.requestedCheckout = null;
    },
    setRequestedFilters(state, action) {
      state.requestedFilters = action.payload;
    },
    clearRequestedFilters(state) {
      state.requestedFilters = null;
    },
    setRequestedCheckout(state, action) {
      state.requestedCheckout = action.payload;
    },
    clearRequestedCheckout(state) {
      state.requestedCheckout = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initSessionAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initSessionAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.sessionId;
      })
      .addCase(initSessionAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(loadSessionAsync.fulfilled, (state, action) => {
        state.sessionId = action.payload.session.id;
        state.messages = (action.payload.messages || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
        }));
      })
      .addCase(sendMessageAsync.rejected, (state, action) => {
        state.error = action.payload;
        state.isStreaming = false;
        state.avatarState = 'idle';
      })
      .addCase(closeSessionAsync.fulfilled, (state) => {
        state.avatarState = 'idle';
      });
  },
});

export const {
  openWidget,
  closeWidget,
  setAvatarState,
  addMessage,
  startStreaming,
  addStreamingChunk,
  finalizeStreamingMessage,
  resetSession,
  setRequestedFilters,
  clearRequestedFilters,
  setRequestedCheckout,
  clearRequestedCheckout,
} = supportSlice.actions;

// Selectors
export const selectSupportOpen = (state) => state.support.isOpen;
export const selectSessionId = (state) => state.support.sessionId;
export const selectMessages = (state) => state.support.messages;
export const selectStreamingContent = (state) => state.support.streamingContent;
export const selectIsStreaming = (state) => state.support.isStreaming;
export const selectAvatarState = (state) => state.support.avatarState;
export const selectSupportLoading = (state) => state.support.isLoading;
export const selectSupportError = (state) => state.support.error;
export const selectRequestedFilters = (state) => state.support.requestedFilters;
export const selectRequestedCheckout = (state) => state.support.requestedCheckout;

export default supportSlice.reducer;
