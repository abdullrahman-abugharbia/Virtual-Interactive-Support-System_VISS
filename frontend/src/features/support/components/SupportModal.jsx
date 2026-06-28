import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeWidget,
  resetSession,
  initSessionAsync,
  closeSessionAsync,
  addMessage,
  setAvatarState,
  selectSessionId,
  selectSupportLoading,
  selectAvatarState,
} from '../supportSlice';
import AvatarCanvas from './AvatarCanvas';
import ChatPanel from './ChatPanel';

const GREETING = "Hi! I'm Aria, your support assistant. How can I help you today?";

// Status chip styling per avatar state (exact rgba values → inline styles).
const CHIP = {
  idle: { label: 'Online', dot: '#34D399', color: '#34D399', background: 'rgba(16,185,129,.1)', borderColor: 'rgba(16,185,129,.3)' },
  listening: { label: 'Listening…', dot: '#34D399', color: '#34D399', background: 'rgba(16,185,129,.12)', borderColor: 'rgba(16,185,129,.35)' },
  thinking: { label: 'Thinking…', dot: '#818CF8', color: '#A5B4FC', background: 'rgba(99,102,241,.14)', borderColor: 'rgba(99,102,241,.4)' },
  speaking: { label: 'Speaking…', dot: '#818CF8', color: '#A5B4FC', background: 'rgba(99,102,241,.14)', borderColor: 'rgba(99,102,241,.4)' },
};

export default function SupportModal() {
  const dispatch = useDispatch();
  const sessionId = useSelector(selectSessionId);
  const isLoading = useSelector(selectSupportLoading);
  const avatarState = useSelector(selectAvatarState);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    dispatch(initSessionAsync(null)).then(() => {
      // Guard against a duplicate greeting if the effect runs twice
      // (StrictMode / remount) while messages persist in the store.
      dispatch((d, getState) => {
        if (getState().support.messages.length === 0) {
          d(addMessage({ role: 'assistant', content: GREETING }));
          d(setAvatarState('speaking'));
        }
      });
    });
  }, [dispatch]);

  function handleClose() {
    if (sessionId) dispatch(closeSessionAsync(sessionId));
    dispatch(closeWidget());
    dispatch(resetSession());
    hasInitialized.current = false;
  }

  const chip = CHIP[avatarState] || CHIP.idle;

  return (
    <div
      className="fixed bottom-[102px] right-7 z-[150] flex animate-fade-up flex-col overflow-hidden rounded-panel border border-line-aria bg-background shadow-aria"
      style={{ width: 'min(400px, calc(100vw - 2rem))', height: 'min(640px, calc(100vh - 140px))' }}
      role="dialog"
      aria-modal="true"
      aria-label="Customer support chat"
    >
      {/* ── Avatar stage (iframe untouched — chrome only) ── */}
      <div className="relative h-[218px] flex-shrink-0 border-b border-line-subtle bg-avatar-stage">
        <AvatarCanvas />

        {/* Overlaid header */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div>
            <div className="text-[15.5px] font-bold tracking-[-0.01em] text-content">Aria</div>
            <div
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-[11px] py-1 text-[11px] font-semibold"
              style={{ color: chip.color, background: chip.background, border: `1px solid ${chip.borderColor}` }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse-dot"
                style={{ background: chip.dot }}
              />
              {chip.label}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-surface/70 text-[13px] text-muted transition-colors hover:bg-line hover:text-content"
            aria-label="Close support chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Chat ── */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm">Starting session…</span>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <ChatPanel sessionId={sessionId} />
        </div>
      )}
    </div>
  );
}
