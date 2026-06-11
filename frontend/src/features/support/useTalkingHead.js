import { useRef, useCallback, useEffect } from 'react';

/**
 * Controls the TalkingHead avatar running inside avatar-frame.html via postMessage.
 *
 * Returns:
 *   iframeRef  — attach to the <iframe> element
 *   speak(text)— make the avatar speak (queued until AVATAR_READY)
 *   setMood(m) — change avatar expression
 */
export function useTalkingHead({ onSpeakEnd }) {
  const iframeRef   = useRef(null);
  const isReady     = useRef(false);
  const speakQueue  = useRef([]);

  const postToFrame = useCallback((type, payload = {}) => {
    iframeRef.current?.contentWindow?.postMessage({ type, payload }, '*');
  }, []);

  // Listen for messages back from the iframe
  useEffect(() => {
    function onMessage(e) {
      const { type } = e.data || {};
      if (type === 'FRAME_LOADED') {
        postToFrame('INIT', {});
      }
      if (type === 'AVATAR_READY') {
        isReady.current = true;
        // Flush any queued speak calls
        while (speakQueue.current.length > 0) {
          postToFrame('SPEAK', { text: speakQueue.current.shift() });
        }
      }
      if (type === 'SPEAK_END') {
        onSpeakEnd?.();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [postToFrame, onSpeakEnd]);

  const speak = useCallback((text) => {
    if (!text) return;
    if (isReady.current) {
      postToFrame('SPEAK', { text });
    } else {
      speakQueue.current.push(text);
    }
  }, [postToFrame]);

  const setMood = useCallback((mood) => {
    postToFrame('SET_MOOD', { mood });
  }, [postToFrame]);

  return { iframeRef, speak, setMood };
}
