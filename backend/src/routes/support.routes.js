const { Router } = require('express');
const { optionalAuth } = require('../middlewares/auth.middleware');
const supportController = require('../controllers/support.controller');

const router = Router();

// POST /support/sessions — start a new chat session (works for guests + logged-in users)
router.post('/sessions', optionalAuth, supportController.startSession);

// GET /support/sessions/:id — fetch session info + message history
router.get('/sessions/:id', optionalAuth, supportController.getSession);

// POST /support/sessions/:id/chat — send a message and stream the LLM reply via SSE
router.post('/sessions/:id/chat', optionalAuth, supportController.chat);

// POST /support/transcribe — transcribe audio via Groq Whisper (base64 JSON body)
router.post('/transcribe', optionalAuth, supportController.transcribe);

// PATCH /support/sessions/:id/close — mark a session as closed
router.patch('/sessions/:id/close', optionalAuth, supportController.closeSession);

module.exports = router;
