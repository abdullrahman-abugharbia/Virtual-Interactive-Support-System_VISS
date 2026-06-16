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
      name: 'show_product',
      description:
        "Open and show a SPECIFIC product's detail page in the store. Use this when the customer names or asks to see one particular product, e.g. \"show me the MacBook Air\", \"open the iPhone 15 Pro\", \"find the Dior Sauvage\". This navigates the store to that product's page.",
      parameters: {
        type: 'object',
        properties: {
          product_name: { type: 'string', description: 'The specific product name to open' },
        },
        required: ['product_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'browse_category',
      description:
        'Filter the products page by a CATEGORY. Use this when the customer wants to browse a TYPE of product rather than one specific item, e.g. "find me a laptop", "search for headphones", "show me smartphones", "I want a watch". This checks that category in the store filter. Available categories: smartphones, laptops, tablets, headphones, cameras, gaming, tvs, watches, fragrances, skincare.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'The category / type of product to filter by (e.g. "laptops")' },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description:
        'Search the catalogue and list matching products in the chat. Use for vague queries, recommendations, or "what do you have" — NOT when the user wants to open one product (use show_product) or browse a category (use browse_category).',
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
      name: 'clear_filters',
      description:
        'Clear all active product filters and show the full catalogue. Use when the user asks to clear/reset filters, "show all products", "go back to all products", or "see everything".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_site',
      description:
        'Run the website product search for a free-text query and show the results page to the customer. Use for product searches that are NOT one specific product (show_product) or a clear single category/brand (browse_category) — e.g. "search for a wireless charger", "find something for gaming", "anything waterproof".',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search keywords to look up' },
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
    `SELECT id, title, discount_price, brand, rating, stock
     FROM products
     WHERE (title ILIKE $1 OR brand ILIKE $1 OR category_id IN (
       SELECT id FROM categories WHERE value ILIKE $1 OR label ILIKE $1
     )) AND deleted = false
     ORDER BY rating DESC
     LIMIT 5`,
    [`%${query}%`]
  );
  return rows.length
    ? { found: rows.length, products: rows }
    : { found: 0, message: `No products found matching "${query}". Try a different search term.` };
}

// Find the single best-matching product to open its detail page.
async function toolShowProduct(productName) {
  const term = String(productName || '').trim();
  if (!term) return { found: false, message: 'No product name provided.' };

  const { rows } = await pool.query(
    `SELECT id, title, brand, discount_price, rating, stock
     FROM products
     WHERE (title ILIKE $1 OR brand ILIKE $1) AND deleted = false
     ORDER BY (title ILIKE $2) DESC, rating DESC
     LIMIT 1`,
    [`%${term}%`, `${term}%`]
  );
  if (!rows.length) {
    return { found: false, message: `No product matching "${term}". Try a different name.` };
  }
  const p = rows[0];
  return {
    found: true,
    product: {
      id: Number(p.id),
      title: p.title,
      brand: p.brand,
      price: Number(p.discount_price),
      rating: Number(p.rating),
      inStock: p.stock > 0,
    },
  };
}

// Resolve a free-text category/type term to a real store category value.
async function toolBrowseCategory(term) {
  const t = String(term || '').trim();
  if (!t) return { matched: false, message: 'No category provided.' };

  const { rows } = await pool.query(
    `SELECT value, label FROM categories
     WHERE value ILIKE $1 OR label ILIKE $1
     ORDER BY (value ILIKE $2) DESC
     LIMIT 1`,
    [`%${t}%`, `${t}%`]
  );
  if (!rows.length) {
    return { matched: false, message: `No category matching "${t}".` };
  }
  return { matched: true, category: rows[0].value, label: rows[0].label };
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

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

// If the user's message literally contains a product's full title (e.g.
// "search for iPhone 14" contains "iPhone 14"), they named a specific product.
async function findProductInMessage(message) {
  const msg = String(message || '');
  if (!msg.trim()) return null;
  const { rows } = await pool.query(
    `SELECT id, title FROM products
     WHERE deleted = false AND $1 ILIKE '%' || title || '%'
     ORDER BY length(title) DESC
     LIMIT 1`,
    [msg]
  );
  return rows[0] ? { id: Number(rows[0].id), title: rows[0].title } : null;
}

// Filler words to ignore when resolving a free-text product search.
const SEARCH_STOPWORDS = new Set([
  'the', 'for', 'you', 'your', 'and', 'but', 'can', 'are', 'was', 'has', 'have',
  'with', 'want', 'wanted', 'wanna', 'find', 'show', 'search', 'need', 'get',
  'got', 'please', 'looking', 'look', 'give', 'gimme', 'see', 'all', 'any',
  'some', 'good', 'better', 'best', 'this', 'that', 'these', 'those', 'what',
  'whats', 'does', 'did', 'about', 'tell', 'help', 'would', 'could', 'should',
  'into', 'from', 'our', 'out', 'here', 'there', 'they', 'them', 'one', 'just',
  'like', 'open', 'view', 'display', 'browse', 'recommend', 'recommendation',
  'product', 'products', 'item', 'items', 'store', 'shop', 'available', 'something',
]);

/**
 * Resolves a free-text query (the user's message) against the real catalogue:
 *   - a single matching product   → { productId, title }   (open its page)
 *   - a brand / category / family → { filters: { brand:[], category:[] } }
 * "iPhone" → all products titled iPhone → brand Apple + category smartphones.
 */
async function resolveSearchFromMessage(message) {
  const words = (String(message || '').toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter((w) => w.length >= 3 && !SEARCH_STOPWORDS.has(w));
  if (!words.length) return null;

  // Expand each word with simple singular/plural variants so "iPhones" matches
  // products titled "iPhone", "watches" matches "watch", etc.
  const variantSet = new Set();
  for (const w of words) {
    variantSet.add(w);
    if (w.length > 3 && w.endsWith('es')) variantSet.add(w.slice(0, -2));
    if (w.length > 3 && w.endsWith('s')) variantSet.add(w.slice(0, -1));
    variantSet.add(`${w}s`);
  }
  const variants = [...variantSet];
  const likeParams = variants.map((w) => `%${w}%`);

  // Word is exactly a brand (e.g. "apple", "sony", "dell").
  const { rows: brandRows } = await pool.query(
    `SELECT DISTINCT brand FROM products WHERE deleted = false AND lower(brand) = ANY($1::text[])`,
    [variants]
  );

  // Word appears in a category value/label (e.g. "laptop" → laptops, "phone" → smartphones).
  const catWhere = variants.map((_, i) => `value ILIKE $${i + 1} OR label ILIKE $${i + 1}`).join(' OR ');
  const { rows: catRows } = await pool.query(`SELECT value FROM categories WHERE ${catWhere}`, likeParams);

  // Word appears in a product title (e.g. "iPhone", "Galaxy", "MacBook").
  const titleWhere = variants.map((_, i) => `p.title ILIKE $${i + 1}`).join(' OR ');
  const { rows: titleRows } = await pool.query(
    `SELECT p.id, p.title, p.brand, c.value AS category_value
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.deleted = false AND (${titleWhere})`,
    likeParams
  );

  // A single specific product (and no brand/category term) → open its page.
  if (titleRows.length === 1 && !brandRows.length && !catRows.length) {
    return { productId: Number(titleRows[0].id), title: titleRows[0].title };
  }

  const brandSet = new Set(brandRows.map((r) => r.brand));
  const catSet = new Set(catRows.map((r) => r.value));

  // Family inference: only when the term isn't itself a brand/category, derive
  // the brand + category from the products whose titles match (e.g. "iPhone").
  if (!brandSet.size && !catSet.size && titleRows.length) {
    for (const r of titleRows) {
      if (r.brand) brandSet.add(r.brand);
      if (r.category_value) catSet.add(r.category_value);
    }
  }

  if (brandSet.size || catSet.size) {
    return { filters: { brand: [...brandSet], category: [...catSet] } };
  }
  return null;
}

// Execute a single tool by name and emit any frontend action it triggers.
async function runTool(name, args, session, onChunk, userMessage) {
  // Deterministic override: for any search/browse/show request that names a
  // specific product, always open that product's page — regardless of which
  // tool the model picked. (Cart tools are intentionally excluded.)
  if (name === 'show_product' || name === 'browse_category' || name === 'search_products') {
    const named = await findProductInMessage(userMessage);
    if (named) {
      onChunk('', { action: 'show_product', productId: named.id, title: named.title });
      return { opened_product: named.title, note: 'Opened the specific product page the user named.' };
    }
  }

  if (name === 'show_product') {
    const result = await toolShowProduct(args.product_name || args.query || '');
    if (result?.found) {
      onChunk('', { action: 'show_product', productId: result.product.id, title: result.product.title });
    }
    return result;
  }
  if (name === 'browse_category') {
    const result = await toolBrowseCategory(args.category || args.query || '');
    if (result?.matched) {
      onChunk('', { action: 'apply_filters', category: [result.category], brand: [] });
    }
    return result;
  }
  if (name === 'search_products') {
    return toolSearchProducts(args.query || '');
  }
  if (name === 'clear_filters') {
    onChunk('', { action: 'apply_filters', category: [], brand: [] });
    return { cleared: true };
  }
  if (name === 'search_site') {
    const q = (args.query || args.term || args.search || '').trim();
    onChunk('', { action: 'search', query: q });
    return toolSearchProducts(q);
  }
  if (name === 'add_to_cart') {
    const result = await toolAddToCart(session?.user_id, args.product_name || '', args.quantity || 1);
    if (result?.success) onChunk('', { action: 'cart_updated', tool: name, result });
    return result;
  }
  if (name === 'remove_from_cart') {
    const result = await toolRemoveFromCart(session?.user_id, args.product_name || '');
    if (result?.success) onChunk('', { action: 'cart_updated', tool: name, result });
    return result;
  }
  return { error: 'Unknown tool' };
}

// Some models emit tool calls as plain text (e.g. <function>name({...})</function>)
// instead of using the native tool-call API. Detect those, run them as a fallback,
// and strip them so they never leak into the chat.
async function handleLeakedToolCalls(text, session, onChunk, userMessage) {
  if (!text || text.indexOf('<') === -1) return text;
  let cleaned = text;

  // Tolerant match for every leaked form:
  //   <function>name({...})</function>, <function=name>{...}</function>,
  //   and the malformed <function=name{...}</function> (no closing '>').
  const blockRe = /<function\b([\s\S]*?)<\/function>/gi;
  const blocks = [];
  let m;
  while ((m = blockRe.exec(text)) !== null) blocks.push(m);
  for (const block of blocks) {
    const inner = block[1] || '';
    const nameFromAttr = inner.match(/=\s*"?([a-zA-Z_]+)/);
    const nameFromCall = inner.match(/([a-zA-Z_]+)\s*\(/);
    const name = (nameFromAttr && nameFromAttr[1]) || (nameFromCall && nameFromCall[1]) || null;
    const jsonMatch = inner.match(/\{[\s\S]*\}/);
    let args = {};
    if (jsonMatch) { try { args = JSON.parse(jsonMatch[0]); } catch { args = {}; } }
    if (name) {
      try { await runTool(name, args, session, onChunk, userMessage); } catch { /* ignore */ }
    }
    cleaned = cleaned.replace(block[0], '');
  }

  // <tool_call>{"name":"...","arguments":{...}}</tool_call>
  const tcRe = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
  const tcs = [];
  while ((m = tcRe.exec(text)) !== null) tcs.push(m);
  for (const tc of tcs) {
    try {
      const obj = JSON.parse(tc[1].trim());
      const name = obj.name;
      const args = obj.arguments || obj.parameters || {};
      if (name) await runTool(name, args, session, onChunk, userMessage);
    } catch { /* ignore */ }
    cleaned = cleaned.replace(tc[0], '');
  }

  return cleaned;
}

// Strip any residual tool-call markup / special tokens from the visible reply.
function sanitizeReply(text) {
  return (text || '')
    .replace(/<function\b[\s\S]*?<\/function>/gi, '')
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
    .replace(/<\/?function[^>]*>/gi, '')
    .replace(/<\|[a-z_]+\|>/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Drives the Groq agent with an iterative tool-calling loop: tools are available
 * on every round and executed as requested, until the model returns a final text
 * answer (or a safety cap is hit). The final answer is sanitized — any leaked
 * text tool-calls are executed and stripped — then streamed to the client.
 *
 * onChunk(text, meta?) — text delta for UI; meta = { action, ... } for side-effects.
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

  const messages = [
    { role: 'system', content: buildSystemPrompt(userContext) },
    ...contextMessages,
    { role: 'user', content: userMessage },
  ];

  // Lock to the FIRST navigation/filter action per turn so the deterministic
  // resolver wins and the model can never override it with a second guess.
  let navLocked = false;
  const NAV_ACTIONS = new Set(['show_product', 'apply_filters', 'filter_category', 'search']);
  const emit = (delta, meta) => {
    if (meta && NAV_ACTIONS.has(meta.action)) {
      if (navLocked) return;
      navLocked = true;
    }
    onChunk(delta, meta);
  };

  // Deterministic navigation/filtering from the user's message — works every
  // time, independent of the model's (sometimes wrong) tool choice.
  const CLEAR_INTENT = /\b(clear|reset)\b[\w\s'-]*\b(filter|filters|all)\b|\bremove\b[\w\s'-]*\bfilters?\b|\ball products\b|\ball items\b|\bshow everything\b|\bsee everything\b|\bgo back to all\b|\bno filters?\b/i;
  const CART_INTENT = /\b(add|cart|buy|buying|bought|purchase|checkout|order|remove|delete|drop)\b/i;

  if (CLEAR_INTENT.test(userMessage)) {
    // "clear filters" / "show all products" / "go back to all products"
    emit('', { action: 'apply_filters', category: [], brand: [] });
    messages.push({
      role: 'system',
      content: '(All store filters have been cleared — the full product list is now shown. Confirm briefly in one sentence. Do NOT call navigation tools.)',
    });
  } else if (!CART_INTENT.test(userMessage)) {
    const named = await findProductInMessage(userMessage);
    if (named) {
      emit('', { action: 'show_product', productId: named.id, title: named.title });
      messages.push({
        role: 'system',
        content: `(The "${named.title}" product page is now open for the customer. Confirm briefly and answer any question about it. Do NOT call navigation tools.)`,
      });
    } else {
      const resolved = await resolveSearchFromMessage(userMessage);
      if (resolved?.productId) {
        emit('', { action: 'show_product', productId: resolved.productId, title: resolved.title });
        messages.push({
          role: 'system',
          content: `(The "${resolved.title}" product page is now open for the customer. Confirm briefly. Do NOT call navigation tools.)`,
        });
      } else if (resolved?.filters && (resolved.filters.brand.length || resolved.filters.category.length)) {
        emit('', { action: 'apply_filters', category: resolved.filters.category, brand: resolved.filters.brand });
        const parts = [];
        if (resolved.filters.brand.length) parts.push(`brand: ${resolved.filters.brand.join(', ')}`);
        if (resolved.filters.category.length) parts.push(`category: ${resolved.filters.category.join(', ')}`);
        messages.push({
          role: 'system',
          content: `(The store is now filtered (${parts.join('; ')}) to show the customer what they asked for. Confirm briefly in one sentence. Do NOT call navigation tools.)`,
        });
      }
    }
  }

  const callGroq = async (attempt = 0) => {
    const res = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.groqApiKey}` },
      body: JSON.stringify({
        model: env.groqModel,
        messages,
        tools: SUPPORT_TOOLS,
        tool_choice: 'auto',
        max_tokens: 400,
        temperature: 0.6,
      }),
    });
    if (res.ok) return res.json();

    const errText = await res.text();
    let errObj = null;
    try { errObj = JSON.parse(errText); } catch { errObj = null; }
    const code = errObj?.error?.code;

    // The model emitted a malformed native tool call → recover by treating the
    // attempted generation as text, so handleLeakedToolCalls can run it.
    if (code === 'tool_use_failed' && errObj.error.failed_generation) {
      return {
        choices: [
          { finish_reason: 'stop', message: { role: 'assistant', content: errObj.error.failed_generation } },
        ],
      };
    }

    // Transient rate limit → wait the suggested time and retry once or twice.
    if (code === 'rate_limit_exceeded' && attempt < 2) {
      const wm = /try again in ([0-9.]+)s/.exec(errObj?.error?.message || '');
      const waitMs = wm ? Math.ceil(parseFloat(wm[1]) * 1000) + 200 : 1200;
      await new Promise((r) => setTimeout(r, waitMs));
      return callGroq(attempt + 1);
    }

    throw new ApiError(502, `Groq API error: ${errText}`);
  };

  const MAX_ROUNDS = 4;

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const data = await callGroq();
    const choice = data.choices?.[0];
    const message = choice?.message || {};

    // Native tool calls → execute, append results, loop again.
    if (
      choice?.finish_reason === 'tool_calls' &&
      Array.isArray(message.tool_calls) &&
      message.tool_calls.length
    ) {
      messages.push(message);
      for (const call of message.tool_calls) {
        let args;
        try { args = JSON.parse(call.function.arguments); } catch { args = {}; }
        const result = await runTool(call.function.name, args, session, emit, userMessage);
        messages.push({ tool_call_id: call.id, role: 'tool', content: JSON.stringify(result) });
      }
      continue;
    }

    // Final answer — run any leaked text tool-calls, sanitize, then stream.
    let text = message.content || '';
    text = await handleLeakedToolCalls(text, session, emit, userMessage);
    text = sanitizeReply(text);
    if (!text) text = 'Done! Is there anything else I can help you with?';
    for (const char of text) onChunk(char);
    return text;
  }

  // Safety cap reached.
  const fallback = "I've taken care of that. Is there anything else I can help you with?";
  for (const char of fallback) onChunk(char);
  return fallback;
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
