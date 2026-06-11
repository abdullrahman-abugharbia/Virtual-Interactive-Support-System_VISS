const { pool } = require('../config/db');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { buildSystemPrompt } = require('../config/support.prompt');

async function createSession(userId = null, guestName = null) {
  const { rows } = await pool.query(
    `INSERT INTO support_sessions (user_id, guest_name)
     VALUES ($1, $2)
     RETURNING id, user_id, guest_name, status, created_at`,
    [userId || null, guestName || null]
  );
  return rows[0];
}

async function getSession(sessionId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, guest_name, status, created_at, updated_at
     FROM support_sessions WHERE id = $1`,
    [sessionId]
  );
  return rows[0] || null;
}

async function getHistory(sessionId) {
  const { rows } = await pool.query(
    `SELECT id, role, content, created_at
     FROM support_messages
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  );
  return rows;
}

async function saveMessage(sessionId, role, content) {
  const { rows } = await pool.query(
    `INSERT INTO support_messages (session_id, role, content)
     VALUES ($1, $2, $3)
     RETURNING id, session_id, role, content, created_at`,
    [sessionId, role, content]
  );
  // bump session updated_at
  await pool.query(
    `UPDATE support_sessions SET updated_at = NOW() WHERE id = $1`,
    [sessionId]
  );
  return rows[0];
}

async function closeSession(sessionId) {
  const { rows } = await pool.query(
    `UPDATE support_sessions SET status = 'closed', updated_at = NOW()
     WHERE id = $1
     RETURNING id, status`,
    [sessionId]
  );
  return rows[0] || null;
}

// ── Groq tool definitions ───────────────────────────────────────────────────
const SUPPORT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products in the store by name, brand, or category.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term (product name, brand, or category)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_to_cart',
      description: 'Add a product to the authenticated user\'s cart. Only available for logged-in users.',
      parameters: {
        type: 'object',
        properties: {
          product_name: { type: 'string', description: 'Product name to search for and add' },
          quantity: { type: 'integer', description: 'Quantity to add (default 1)', default: 1 },
        },
        required: ['product_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_from_cart',
      description: 'Remove a product from the authenticated user\'s cart.',
      parameters: {
        type: 'object',
        properties: {
          product_name: { type: 'string', description: 'Product name to remove' },
        },
        required: ['product_name'],
      },
    },
  },
];

async function toolSearchProducts(query) {
  const { rows } = await pool.query(
    `SELECT title, discount_price, brand, rating, stock
     FROM products
     WHERE (title ILIKE $1 OR brand ILIKE $1 OR category_id IN (
       SELECT id FROM categories WHERE name ILIKE $1
     )) AND deleted = false
     ORDER BY rating DESC
     LIMIT 5`,
    [`%${query}%`]
  );
  return rows.length
    ? { found: rows.length, products: rows }
    : { found: 0, message: `No products found matching "${query}". Try a different search term.` };
}

async function toolAddToCart(userId, productName, quantity = 1) {
  if (!userId) return { error: 'User must be logged in to add items to cart.' };

  const { rows: products } = await pool.query(
    `SELECT id, title, discount_price FROM products
     WHERE title ILIKE $1 AND deleted = false
     ORDER BY rating DESC LIMIT 1`,
    [`%${productName}%`]
  );
  if (!products.length) return { error: `Product "${productName}" not found. Try searching first.` };
  const product = products[0];

  // Get or create cart
  let { rows: [cart] } = await pool.query(`SELECT id FROM carts WHERE user_id = $1`, [userId]);
  if (!cart) {
    ({ rows: [cart] } = await pool.query(
      `INSERT INTO carts (user_id) VALUES ($1) RETURNING id`, [userId]
    ));
  }

  await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
    [cart.id, product.id, quantity]
  );

  return { success: true, added: product.title, quantity, price: `$${Number(product.discount_price).toFixed(2)}` };
}

async function toolRemoveFromCart(userId, productName) {
  if (!userId) return { error: 'User must be logged in to modify cart.' };

  const { rows: products } = await pool.query(
    `SELECT id, title FROM products WHERE title ILIKE $1 AND deleted = false LIMIT 1`,
    [`%${productName}%`]
  );
  if (!products.length) return { error: `Product "${productName}" not found.` };

  const { rows: [cart] } = await pool.query(`SELECT id FROM carts WHERE user_id = $1`, [userId]);
  if (!cart) return { error: 'Cart is empty.' };

  const { rowCount } = await pool.query(
    `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
    [cart.id, products[0].id]
  );

  return rowCount > 0
    ? { success: true, removed: products[0].title }
    : { error: `${products[0].title} was not in your cart.` };
}

/**
 * Fetches user profile, recent orders, and cart from the DB for LLM context.
 * Returns null for guest sessions (no userId).
 */
async function fetchUserContext(userId) {
  if (!userId) return null;

  const { rows: users } = await pool.query(
    `SELECT name, email FROM users WHERE id = $1`,
    [userId]
  );
  const user = users[0];
  if (!user) return null;

  const { rows: orders } = await pool.query(
    `SELECT o.id, o.status, o.payment_status, o.total_amount, o.created_at,
            json_agg(json_build_object(
              'title', oi.snapshot_title,
              'qty',   oi.quantity,
              'price', oi.discount_price
            )) AS items
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT 3`,
    [userId]
  );

  const { rows: cartItems } = await pool.query(
    `SELECT p.title, ci.quantity, p.discount_price, p.brand
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p    ON p.id = ci.product_id
     WHERE c.user_id = $1`,
    [userId]
  );

  return { user, orders, cartItems };
}

/**
 * Streams a Groq LLM response with function-calling support.
 * Phase 1: Non-streaming call with tools to detect intent.
 * Phase 2: If tools called, execute them and stream the follow-up reply.
 *          If no tools, simulate streaming from the phase-1 text.
 *
 * onChunk(text, meta?) — text delta for UI; meta = { action, result } for side-effects.
 */
async function streamGroqResponse(sessionId, userMessage, onChunk) {
  if (!env.groqApiKey) {
    throw new ApiError(500, 'Groq API key is not configured');
  }

  const session = await getSession(sessionId);
  const userContext = await fetchUserContext(session?.user_id || null);

  const history = await getHistory(sessionId);
  const contextMessages = history.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const systemMessages = [
    { role: 'system', content: buildSystemPrompt(userContext) },
    ...contextMessages,
    { role: 'user', content: userMessage },
  ];

  // ── Phase 1: Detect tool calls (non-streaming) ───────────────────────────
  const phase1 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.groqApiKey}` },
    body: JSON.stringify({
      model: env.groqModel,
      messages: systemMessages,
      tools: SUPPORT_TOOLS,
      tool_choice: 'auto',
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!phase1.ok) {
    const err = await phase1.text();
    throw new ApiError(502, `Groq API error: ${err}`);
  }

  const phase1Data = await phase1.json();
  const choice = phase1Data.choices?.[0];

  // ── No tool call — simulate streaming from the text response ─────────────
  if (choice?.finish_reason !== 'tool_calls') {
    const text = choice?.message?.content || '';
    for (const char of text) {
      onChunk(char);
    }
    return text;
  }

  // ── Tool calls detected — execute each tool ───────────────────────────────
  const toolCalls    = choice.message.tool_calls || [];
  const toolMessages = [];

  for (const call of toolCalls) {
    let args;
    try { args = JSON.parse(call.function.arguments); } catch { args = {}; }

    let result;
    if (call.function.name === 'search_products') {
      result = await toolSearchProducts(args.query || '');
    } else if (call.function.name === 'add_to_cart') {
      result = await toolAddToCart(session.user_id, args.product_name || '', args.quantity || 1);
    } else if (call.function.name === 'remove_from_cart') {
      result = await toolRemoveFromCart(session.user_id, args.product_name || '');
    } else {
      result = { error: 'Unknown tool' };
    }

    // Notify frontend of cart changes via meta
    if (result?.success && (call.function.name === 'add_to_cart' || call.function.name === 'remove_from_cart')) {
      onChunk('', { action: 'cart_updated', tool: call.function.name, result });
    }

    toolMessages.push({
      tool_call_id: call.id,
      role: 'tool',
      content: JSON.stringify(result),
    });
  }

  // ── Phase 2: Stream the follow-up reply with tool results in context ──────
  const phase2Messages = [
    ...systemMessages,
    choice.message,   // assistant turn with tool_calls
    ...toolMessages,  // tool results
  ];

  const phase2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.groqApiKey}` },
    body: JSON.stringify({
      model: env.groqModel,
      messages: phase2Messages,
      stream: true,
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!phase2.ok) {
    const err = await phase2.text();
    throw new ApiError(502, `Groq API error (phase 2): ${err}`);
  }

  let fullReply = '';
  const decoder = new TextDecoder();

  for await (const chunk of phase2.body) {
    const text = decoder.decode(chunk, { stream: true });
    const lines = text.split('\n').filter((l) => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        const delta  = parsed.choices?.[0]?.delta?.content;
        if (delta) { fullReply += delta; onChunk(delta); }
      } catch { /* skip malformed SSE lines */ }
    }
  }

  return fullReply;
}

/**
 * Transcribes audio using Groq's Whisper API.
 * Accepts a Buffer and the original MIME type, returns the transcript string.
 * Builds multipart/form-data manually to avoid Node.js Blob/File compatibility issues.
 */
async function transcribeAudio(audioBuffer, mimeType) {
  if (!env.groqApiKey) {
    throw new ApiError(500, 'Groq API key is not configured');
  }

  // Strip codec parameters: 'audio/webm;codecs=opus' → 'audio/webm'
  const baseType = (mimeType || 'audio/webm').split(';')[0].trim();

  const ext = baseType.includes('ogg') ? 'ogg'
    : baseType.includes('wav') ? 'wav'
    : baseType.includes('mp3') || baseType.includes('mpeg') ? 'mp3'
    : baseType.includes('mp4') || baseType.includes('m4a') ? 'mp4'
    : 'webm';

  const boundary = `----boundary${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const CRLF = '\r\n';

  // Build the multipart body as a Buffer to avoid any FormData/Blob issues in Node.js
  const fileHeader = Buffer.from(
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="file"; filename="audio.${ext}"${CRLF}` +
    `Content-Type: ${baseType}${CRLF}` +
    CRLF
  );

  const rest = Buffer.from(
    `${CRLF}--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="model"${CRLF}` +
    CRLF +
    `whisper-large-v3-turbo` +
    `${CRLF}--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="response_format"${CRLF}` +
    CRLF +
    `json` +
    `${CRLF}--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="language"${CRLF}` +
    CRLF +
    `en` +
    `${CRLF}--${boundary}--${CRLF}`
  );

  const body = Buffer.concat([fileHeader, audioBuffer, rest]);

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.groqApiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new ApiError(502, `Groq STT error: ${errText}`);
  }

  const data = await response.json();
  return data.text || '';
}

module.exports = {
  createSession,
  getSession,
  getHistory,
  saveMessage,
  closeSession,
  fetchUserContext,
  streamGroqResponse,
  transcribeAudio,
};
