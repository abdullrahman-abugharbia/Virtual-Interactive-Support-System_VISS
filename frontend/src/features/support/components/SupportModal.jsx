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
} from '../supportSlice';
import AvatarCanvas from './AvatarCanvas';
import ChatPanel from './ChatPanel';

const GREETING = "Hi! I'm Aria, your support assistant. How can I help you today?";

export default function SupportModal() {
  const dispatch = useDispatch();
  const sessionId = useSelector(selectSessionId);
  const isLoading = useSelector(selectSupportLoading);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    dispatch(initSessionAsync(null)).then(() => {
      dispatch(addMessage({ role: 'assistant', content: GREETING }));
      dispatch(setAvatarState('speaking'));
    });
  }, [dispatch]);

  function handleClose() {
    if (sessionId) dispatch(closeSessionAsync(sessionId));
    dispatch(closeWidget());
    dispatch(resetSession());
    hasInitialized.current = false;
  }

  return (
    /* Fixed bottom-right corner card — sits just above the FAB */
    <div
      className="fixed z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden"
      style={{ top: '12rem', left: '1rem', width: 'min(460px, calc(100vw - 3rem))', height: 'min(620px, calc(100vh - 8rem))' }}
      role="dialog"
      aria-modal="true"
      aria-label="Customer support chat"
    >
      {/* ── TOP: 3-D Avatar panel ──────────────────────────────── */}
      <div style={{ height: 240, flexShrink: 0 }}>
        <AvatarCanvas />
      </div>

      {/* ── BOTTOM: Chat panel ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 bg-white min-w-0 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Aria</p>
              <p className="text-xs text-green-500 font-medium">● Online</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close support chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Starting session…</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <ChatPanel sessionId={sessionId} />
          </div>
        )}
      </div>
    </div>
  );
}
