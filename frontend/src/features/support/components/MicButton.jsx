import React, { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../supportAPI';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Push-to-talk mic button. Records audio via MediaRecorder, sends to the
 * backend Groq Whisper STT endpoint, then calls onTranscript(text).
 */
export default function MicButton({ onTranscript, onListeningChange, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startListening = useCallback(async () => {
    if (isListening || isProcessing || disabled) return;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert('Microphone access denied. Please allow microphone access and try again.');
      return;
    }

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });

      setIsListening(false);
      setIsProcessing(true);
      try {
        const base64 = await blobToBase64(blob);
        const transcript = await transcribeAudio(base64, mimeType);
        if (transcript.trim()) onTranscript(transcript.trim());
      } catch (err) {
        console.error('[MicButton] transcription failed:', err);
        alert(`Transcription error: ${err.message}`);
      } finally {
        setIsProcessing(false);
        onListeningChange(false);
      }
    };

    mediaRecorder.start();
    setIsListening(true);
    onListeningChange(true);
  }, [isListening, isProcessing, disabled, onTranscript, onListeningChange]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const active = isListening;

  return (
    <button
      type="button"
      onMouseDown={startListening}
      onMouseUp={stopListening}
      onMouseLeave={stopListening}
      onTouchStart={startListening}
      onTouchEnd={stopListening}
      disabled={disabled || isProcessing}
      title={isProcessing ? 'Transcribing…' : 'Hold to speak'}
      style={{
        background: active ? 'rgba(244,63,94,.16)' : '#1E293B',
        borderColor: active ? 'rgba(244,63,94,.6)' : '#334155',
      }}
      className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-150 focus:outline-none ${
        disabled || isProcessing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
      aria-label={isListening ? 'Listening — release to send' : isProcessing ? 'Transcribing…' : 'Hold to speak'}
    >
      {active && (
        <span className="absolute inset-0 rounded-full border-[1.5px] border-error/55 animate-ring-mic" />
      )}

      {isProcessing ? (
        <span className="relative z-10 h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-transparent" />
      ) : (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? '#FDA4AF' : '#94A3B8'}
          strokeWidth="2"
          strokeLinecap="round"
          className="relative z-10"
        >
          <rect x="9" y="3" width="6" height="11" rx="3" fill={active ? '#FDA4AF' : '#94A3B8'} stroke="none" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <line x1="12" y1="18" x2="12" y2="21" />
        </svg>
      )}
    </button>
  );
}
