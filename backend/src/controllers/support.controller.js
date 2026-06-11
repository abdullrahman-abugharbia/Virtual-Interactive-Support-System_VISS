const asyncHandler = require('../utils/asyncHandler');
const supportService = require('../services/support.service');
const ApiError = require('../utils/ApiError');

const startSession = asyncHandler(async (req, res) => {
  const userId = req.auth?.id || null;
  const guestName = req.body?.guestName || null;
  const session = await supportService.createSession(userId, guestName);
  res.status(201).json({ sessionId: session.id, status: session.status, createdAt: session.created_at });
});

const getSession = asyncHandler(async (req, res) => {
  const session = await supportService.getSession(req.params.id);
  if (!session) throw new ApiError(404, 'Session not found');

  const messages = await supportService.getHistory(req.params.id);
  res.status(200).json({ session, messages });
});

const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new ApiError(400, 'message is required');
  }

  const session = await supportService.getSession(req.params.id);
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.status === 'closed') throw new ApiError(400, 'Session is closed');

  // Save user message
  await supportService.saveMessage(req.params.id, 'user', message.trim());

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let fullReply = '';
  try {
    fullReply = await supportService.streamGroqResponse(
      req.params.id,
      message.trim(),
      (delta, meta) => {
        if (meta) {
          // Side-effect event (e.g. cart_updated) — no text delta
          res.write(`data: ${JSON.stringify(meta)}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        }
      }
    );
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // Save full assistant reply
  if (fullReply) {
    await supportService.saveMessage(req.params.id, 'assistant', fullReply);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

const transcribe = asyncHandler(async (req, res) => {
  const { audio, mimeType } = req.body;
  if (!audio || typeof audio !== 'string') throw new ApiError(400, 'audio (base64) is required');

  const buffer = Buffer.from(audio, 'base64');
  const transcript = await supportService.transcribeAudio(buffer, mimeType || 'audio/webm');
  res.status(200).json({ transcript });
});

const closeSession = asyncHandler(async (req, res) => {
  const session = await supportService.getSession(req.params.id);
  if (!session) throw new ApiError(404, 'Session not found');

  const updated = await supportService.closeSession(req.params.id);
  res.status(200).json(updated);
});

module.exports = { startSession, getSession, chat, transcribe, closeSession };
