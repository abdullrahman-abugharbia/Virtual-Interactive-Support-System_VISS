import React, { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAvatarState, selectMessages, setAvatarState } from '../supportSlice';
import { useTalkingHead } from '../useTalkingHead';

// Fallback: reset to idle if SPEAK_END never arrives (e.g. avatar model fails to load)
const SPEAK_TIMEOUT_MS = 30_000;

const MOOD_MAP = {
  idle     : 'neutral',
  listening: 'happy',
  thinking : 'neutral',
  speaking : 'neutral',
};

export default function AvatarCanvas() {
  const dispatch      = useDispatch();
  const avatarState   = useSelector(selectAvatarState);
  const messages      = useSelector(selectMessages);
  const speakTimerRef = useRef(null);

  const handleSpeakEnd = useCallback(() => {
    clearTimeout(speakTimerRef.current);
    dispatch(setAvatarState('idle'));
  }, [dispatch]);

  const { iframeRef, speak, setMood } = useTalkingHead({
    onSpeakEnd: handleSpeakEnd,
  });

  // Sync avatar mood to conversation state
  useEffect(() => {
    setMood(MOOD_MAP[avatarState] || 'neutral');
  }, [avatarState, setMood]);

  // Speak the latest assistant message when state becomes 'speaking'
  useEffect(() => {
    if (avatarState !== 'speaking') return;
    const last = [...messages].reverse().find((m) => m.role === 'assistant');
    if (last) {
      speak(last.content);
      speakTimerRef.current = setTimeout(() => dispatch(setAvatarState('idle')), SPEAK_TIMEOUT_MS);
    } else {
      dispatch(setAvatarState('idle'));
    }
    return () => clearTimeout(speakTimerRef.current);
  }, [avatarState, messages, speak, dispatch]);

  return (
    <div
      className="relative w-full h-full"
      style={{ background: 'linear-gradient(to bottom, #eef2ff, #ffffff)', borderRadius: '1rem 0 0 1rem', overflow: 'hidden' }}
    >
      <iframe
        ref={iframeRef}
        src="/avatar-frame.html"
        title="Aria avatar"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="microphone"
      />
    </div>
  );
}
