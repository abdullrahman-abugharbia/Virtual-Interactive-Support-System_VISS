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

  return (
    <button
      type="button"
      onMouseDown={startListening}
      onMouseUp={stopListening}
      onTouchStart={startListening}
      onTouchEnd={stopListening}
      disabled={disabled || isProcessing}
      title={isProcessing ? 'Transcribing…' : 'Hold to speak'}
      className={`
        relative flex items-center justify-center w-12 h-12 rounded-full
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isListening
          ? 'bg-red-500 focus:ring-red-400 scale-110'
          : isProcessing
            ? 'bg-indigo-400 focus:ring-indigo-300'
            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}
        ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-label={isListening ? 'Listening — release to send' : isProcessing ? 'Transcribing…' : 'Hold to speak'}
    >
      {isListening && (
        <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
      )}

      {isProcessing ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
      ) : (
        <svg className="w-5 h-5 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
          <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 11z" />
        </svg>
      )}
    </button>
  );
}
