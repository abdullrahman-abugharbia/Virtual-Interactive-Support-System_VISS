import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectMessages,
  selectStreamingContent,
  selectIsStreaming,
  selectAvatarState,
  sendMessageAsync,
  setAvatarState,
} from '../supportSlice';
import MicButton from './MicButton';

const AVATAR_BUBBLE =
  'flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-logo-gradient text-xs font-bold text-white';

export default function ChatPanel({ sessionId }) {
  const dispatch = useDispatch();
  const messages = useSelector(selectMessages);
  const streamingContent = useSelector(selectStreamingContent);
  const isStreaming = useSelector(selectIsStreaming);
  const avatarState = useSelector(selectAvatarState);

  const [inputText, setInputText] = useState('');
  const bottomRef = useRef(null);
  const isBusy = isStreaming || avatarState === 'thinking' || avatarState === 'speaking';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  function handleSend(text) {
    const trimmed = (text || inputText).trim();
    if (!trimmed || !sessionId || isBusy) return;
    setInputText('');
    dispatch(sendMessageAsync({ sessionId, message: trimmed }));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleListeningChange(listening) {
    dispatch(setAvatarState(listening ? 'listening' : 'idle'));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {messages.map((msg) =>
          msg.role === 'assistant' ? (
            <div key={msg.id} className="flex items-start gap-2">
              <span className={AVATAR_BUBBLE}>A</span>
              <div className="max-w-[78%] rounded-[14px] rounded-tl-[4px] border border-line-aria bg-surface px-3.5 py-2.5 text-[13.5px] leading-[1.55] text-[#E2E8F0]">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[78%] rounded-[14px] rounded-tr-[4px] bg-primary px-3.5 py-2.5 text-[13.5px] leading-[1.55] text-white">
                {msg.content}
              </div>
            </div>
          )
        )}

        {/* Streaming message bubble */}
        {isStreaming && streamingContent && (
          <div className="flex items-start gap-2">
            <span className={AVATAR_BUBBLE}>A</span>
            <div className="max-w-[78%] rounded-[14px] rounded-tl-[4px] border border-line-aria bg-surface px-3.5 py-2.5 text-[13.5px] leading-[1.55] text-[#E2E8F0]">
              {streamingContent}
              <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-muted align-middle" />
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {avatarState === 'thinking' && !isStreaming && (
          <div className="flex items-start gap-2">
            <span className={AVATAR_BUBBLE}>A</span>
            <div className="flex items-center gap-1.5 rounded-[14px] rounded-tl-[4px] border border-line-aria bg-surface px-4 py-3.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-hover animate-dot-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary-hover animate-dot-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary-hover animate-dot-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex flex-shrink-0 items-center gap-2.5 border-t border-line-subtle bg-[#141E38]/50 px-3.5 py-3">
        <MicButton
          onTranscript={handleSend}
          onListeningChange={handleListeningChange}
          disabled={isBusy}
        />

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isBusy}
          placeholder="Message Aria…"
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-[11px] text-[13.5px] text-content outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary-soft disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={isBusy || !inputText.trim()}
          className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
          aria-label="Send"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
