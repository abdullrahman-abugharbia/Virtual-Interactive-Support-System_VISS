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
            dispatch(finalizeStreamingMessage());
            dispatch(setAvatarState('speaking'));
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.delta) dispatch(addStreamingChunk(parsed.delta));
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.action === 'cart_updated') {
              dispatch(fetchItemsByUserIdAsync());
            } else if (parsed.action === 'show_product' && parsed.productId) {
              // Aria found a specific product → open its detail page
              router.navigate(`/product-detail/${parsed.productId}`);
            } else if (parsed.action === 'search') {
              // Aria ran a free-text site search → show results on the listing
              router.navigate(parsed.query ? `/?q=${encodeURIComponent(parsed.query)}` : '/');
            } else if (parsed.action === 'apply_filters') {
              // Aria resolved a brand/category search → check those filters
              dispatch(
                setRequestedFilters({
                  category: parsed.category || [],
                  brand: parsed.brand || [],
                })
              );
              router.navigate('/');
            } else if (parsed.action === 'filter_category' && parsed.category) {
              // Backward-compat: single category
              dispatch(setRequestedFilters({ category: [parsed.category], brand: [] }));
              router.navigate('/');
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      dispatch(finalizeStreamingMessage());
      dispatch(setAvatarState('speaking'));
    } catch (err) {
      dispatch(setAvatarState('idle'));
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
    },
    setRequestedFilters(state, action) {
      state.requestedFilters = action.payload;
    },
    clearRequestedFilters(state) {
      state.requestedFilters = null;
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

export default supportSlice.reducer;
