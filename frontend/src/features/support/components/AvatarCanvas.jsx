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
  const lastSpokenIdRef = useRef(null); // id of the message already spoken — never repeat it

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

  // Speak the latest assistant message ONCE, when state becomes 'speaking'.
  useEffect(() => {
    if (avatarState !== 'speaking') return;
    const last = [...messages].reverse().find((m) => m.role === 'assistant');
    // Nothing to say, or we already spoke this exact message → go idle, don't repeat.
    if (!last || lastSpokenIdRef.current === last.id) {
      dispatch(setAvatarState('idle'));
      return;
    }
    lastSpokenIdRef.current = last.id;
    speak(last.content);
    speakTimerRef.current = setTimeout(() => dispatch(setAvatarState('idle')), SPEAK_TIMEOUT_MS);
    return () => clearTimeout(speakTimerRef.current);
  }, [avatarState, messages, speak, dispatch]);

  return (
    <div
      className="relative h-full w-full"
      style={{ background: 'transparent', overflow: 'hidden' }}
    >
      <iframe
        ref={iframeRef}
        src="/avatar-frame.html?v=2"
        title="Aria avatar"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: 'transparent' }}
        allow="microphone"
      />
    </div>
  );
}
