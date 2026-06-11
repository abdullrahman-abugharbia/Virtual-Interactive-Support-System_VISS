import { BASE_URL } from '../../app/constants';

const SUPPORT_URL = `${BASE_URL}/support`;

export async function createSession(guestName = null) {
  const response = await fetch(`${SUPPORT_URL}/sessions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ guestName }),
  });
  if (!response.ok) throw new Error('Failed to start support session');
  return response.json();
}

export async function fetchSession(sessionId) {
  const response = await fetch(`${SUPPORT_URL}/sessions/${sessionId}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch session');
  return response.json();
}

export async function closeSession(sessionId) {
  const response = await fetch(`${SUPPORT_URL}/sessions/${sessionId}/close`, {
    method: 'PATCH',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to close session');
  return response.json();
}

/**
 * Sends a base64-encoded audio blob to the backend for Whisper transcription.
 * Returns the transcript string.
 */
export async function transcribeAudio(base64Audio, mimeType) {
  const response = await fetch(`${SUPPORT_URL}/transcribe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ audio: base64Audio, mimeType }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Transcription failed');
  }
  const data = await response.json();
  return data.transcript || '';
}

/**
 * Sends a message and returns a ReadableStream of SSE events.
 * Caller is responsible for reading the stream.
 */
export async function sendMessageStream(sessionId, message) {
  const response = await fetch(`${SUPPORT_URL}/sessions/${sessionId}/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.body;
}
