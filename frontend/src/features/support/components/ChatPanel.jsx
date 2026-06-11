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

export default function ChatPanel({ sessionId }) {
  const dispatch = useDispatch();
  const messages = useSelector(selectMessages);
  const streamingContent = useSelector(selectStreamingContent);
  const isStreaming = useSelector(selectIsStreaming);
  const avatarState = useSelector(selectAvatarState);

  const [inputText, setInputText] = useState('');
  const bottomRef = useRef(null);
  const isBusy = isStreaming || avatarState === 'thinking' || avatarState === 'speaking';

  // Auto-scroll to bottom whenever messages or streaming content changes
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
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                A
              </div>
            )}
            <div
              className={`
                max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'}
              `}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming message bubble */}
        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
              A
            </div>
            <div className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-2 text-sm leading-relaxed bg-gray-100 text-gray-800">
              {streamingContent}
              <span className="inline-block w-1 h-3 bg-gray-500 ml-1 animate-pulse" />
            </div>
          </div>
        )}

        {/* Thinking indicator */}
        {avatarState === 'thinking' && !isStreaming && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
              A
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex space-x-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-200 px-3 py-2 flex items-center gap-2 bg-white">
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
          placeholder="Type a message…"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={isBusy || !inputText.trim()}
          className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center transition-colors"
          aria-label="Send"
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
