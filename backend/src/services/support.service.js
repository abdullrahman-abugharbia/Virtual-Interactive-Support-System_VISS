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
      name: 'filter_products',
      description:
        'Filter the products page by any combination of category, brand, and price range, then show it. Use for requests like "laptops under $1000", "Apple phones between $500 and $900", "show me cheap headphones", "Sony stuff over $200". Categories: smartphones, laptops, tablets, headphones, cameras, gaming, tvs, watches, fragrances, skincare.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Category to filter by (optional), e.g. "laptops"' },
          brand: { type: 'string', description: 'Brand to filter by (optional), e.g. "Apple"' },
          min_price: { type: 'number', description: 'Minimum price in dollars (optional)' },
          max_price: { type: 'number', description: 'Maximum price in dollars (optional)' },
        },
        required: [],
      },
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
      name: 'open_page',
      description:
        "Navigate the customer to a page in the store. Pages: 'home'/'products' (the catalogue), 'cart' (their shopping cart), 'checkout' (the checkout page — you may take them there, but you must NEVER place the order or pay), 'orders' (their order history), 'profile' (their account). Use when they ask to go to / see / open one of these. Logged-in users only. Do NOT use this to ADD or REMOVE cart items — use the cart tools for that.",
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            enum: ['home', 'products', 'cart', 'checkout', 'orders', 'profile'],
            description: 'Which page to open',
          },
        },
        required: ['page'],
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
      description:
        "Remove a product from the logged-in customer's cart. DESTRUCTIVE: first ask the customer to confirm, then call again with confirmed=true. Never remove without explicit confirmation.",
      parameters: {
        type: 'object',
        properties: {
          product_name: { type: 'string', description: 'Product name to remove' },
          confirmed: { type: 'boolean', description: 'Set true ONLY after the customer has explicitly confirmed the removal.' },
        },
        required: ['product_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_cart_quantity',
      description:
        "Change the quantity of a product already in the logged-in customer's cart. Use for \"make it 3\", \"change the iPhone to 2\", \"increase the quantity\". To remove an item entirely, use remove_from_cart instead.",
      parameters: {
        type: 'object',
        properties: {
          product_name: { type: 'string', description: 'Product in the cart to update' },
          quantity: { type: 'integer', description: 'New quantity (1 or more)' },
        },
        required: ['product_name', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clear_cart',
      description:
        "Empty the logged-in customer's cart entirely. DESTRUCTIVE: first ask the customer to confirm, then call again with confirmed=true. Never clear the cart without explicit confirmation.",
      parameters: {
        type: 'object',
        properties: {
          confirmed: { type: 'boolean', description: 'Set true ONLY after the customer has explicitly confirmed emptying the cart.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fill_checkout',
      description:
        "Pre-fill the checkout shipping form with the address/contact details the customer gives you (e.g. \"ship to John Doe, 12 Main St, New York, NY 10001, 555-1234, john@x.com\"). This ONLY types the details into the form for them — you do NOT submit it, save the address, or place the order; the customer reviews and does that. Logged-in customers only. Pass only the fields the customer actually provided.",
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full name for shipping' },
          email: { type: 'string', description: 'Contact email' },
          street: { type: 'string', description: 'Street address' },
          city: { type: 'string', description: 'City' },
          state: { type: 'string', description: 'State / province' },
          pinCode: { type: 'string', description: 'ZIP / postal code' },
          phone: { type: 'string', description: 'Phone number' },
          paymentMethod: { type: 'string', enum: ['card', 'cash'], description: 'Optional preferred payment method to pre-select' },
        },
        required: [],
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

// Resolve a category/brand/price-range request to real catalogue values and apply
// them as store filters (emits apply_filters, which the listing consumes).
async function toolFilterProducts(args, onChunk) {
  const out = { category: [], brand: [] };

  if (args.category) {
    const { rows } = await pool.query(
      `SELECT value FROM categories WHERE value ILIKE $1 OR label ILIKE $1
       ORDER BY (value ILIKE $2) DESC LIMIT 1`,
      [`%${args.category}%`, `${args.category}%`]
    );
    if (rows[0]) out.category = [rows[0].value];
  }
  if (args.brand) {
    const { rows } = await pool.query(
      `SELECT DISTINCT brand FROM products WHERE deleted = false AND brand ILIKE $1 ORDER BY brand LIMIT 1`,
      [`%${args.brand}%`]
    );
    if (rows[0]) out.brand = [rows[0].brand];
  }

  const payload = { action: 'apply_filters', category: out.category, brand: out.brand };
  const min = args.min_price != null && args.min_price !== '' ? Number(args.min_price) : null;
  const max = args.max_price != null && args.max_price !== '' ? Number(args.max_price) : null;
  if (Number.isFinite(min)) payload.minPrice = min;
  if (Number.isFinite(max)) payload.maxPrice = max;

  onChunk('', payload);
  return {
    filtered: true,
    category: out.category,
    brand: out.brand,
    minPrice: payload.minPrice ?? null,
    maxPrice: payload.maxPrice ?? null,
    note: 'Store filtered. Briefly tell the customer what you filtered to.',
  };
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

async function toolRemoveFromCart(userId, productName, confirmed) {
  if (!userId) return { error: 'User must be logged in to modify cart.' };

  const { rows: products } = await pool.query(
    `SELECT id, title FROM products WHERE title ILIKE $1 AND deleted = false LIMIT 1`,
    [`%${productName}%`]
  );
  if (!products.length) return { error: `Product "${productName}" not found.` };

  const { rows: [cart] } = await pool.query(`SELECT id FROM carts WHERE user_id = $1`, [userId]);
  if (!cart) return { error: 'Cart is empty.' };

  const { rows: inCart } = await pool.query(
    `SELECT 1 FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
    [cart.id, products[0].id]
  );
  if (!inCart.length) return { error: `${products[0].title} was not in your cart.` };

  // Destructive — require explicit confirmation before deleting.
  if (!confirmed) {
    return {
      needs_confirmation: true,
      product: products[0].title,
      message: `Ask the customer to confirm removing "${products[0].title}" from their cart. Only call remove_from_cart again with confirmed=true after they clearly say yes.`,
    };
  }

  const { rowCount } = await pool.query(
    `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
    [cart.id, products[0].id]
  );

  return rowCount > 0
    ? { success: true, removed: products[0].title }
    : { error: `${products[0].title} was not in your cart.` };
}

async function toolUpdateCartQuantity(userId, productName, quantity) {
  if (!userId) return { error: 'User must be logged in to modify cart.' };
  const qty = parseInt(quantity, 10);
  if (!Number.isFinite(qty) || qty < 1) {
    return { error: 'Quantity must be a whole number of 1 or more. To remove an item, use remove_from_cart.' };
  }

  const { rows: products } = await pool.query(
    `SELECT id, title FROM products WHERE title ILIKE $1 AND deleted = false ORDER BY rating DESC LIMIT 1`,
    [`%${productName}%`]
  );
  if (!products.length) return { error: `Product "${productName}" not found.` };

  const { rows: [cart] } = await pool.query(`SELECT id FROM carts WHERE user_id = $1`, [userId]);
  if (!cart) return { error: 'Cart is empty.' };

  const { rowCount } = await pool.query(
    `UPDATE cart_items SET quantity = $3 WHERE cart_id = $1 AND product_id = $2`,
    [cart.id, products[0].id, qty]
  );

  return rowCount > 0
    ? { success: true, updated: products[0].title, quantity: qty }
    : { error: `${products[0].title} is not in your cart — add it first.` };
}

async function toolClearCart(userId, confirmed) {
  if (!userId) return { error: 'User must be logged in to modify cart.' };

  const { rows: [cart] } = await pool.query(`SELECT id FROM carts WHERE user_id = $1`, [userId]);
  if (!cart) return { success: true, cleared: 0, note: 'Cart was already empty.' };

  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM cart_items WHERE cart_id = $1`,
    [cart.id]
  );
  if (!count) return { success: true, cleared: 0, note: 'Cart is already empty.' };

  // Destructive — require explicit confirmation before emptying.
  if (!confirmed) {
    return {
      needs_confirmation: true,
      items_in_cart: count,
      message: `Ask the customer to confirm emptying their cart (${count} item(s)). Only call clear_cart again with confirmed=true after they clearly say yes.`,
    };
  }

  await pool.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart.id]);
  return { success: true, cleared: count };
}

// Pages Aria can navigate the logged-in customer to (customer-facing only — no
// admin, login, or logout).
const PAGE_ROUTES = {
  home:     { path: '/',          label: 'the storefront' },
  products: { path: '/',          label: 'the products page' },
  orders:   { path: '/my-orders', label: 'your orders' },
  cart:     { path: '/cart',      label: 'your cart' },
  checkout: { path: '/checkout',  label: 'checkout' },
  profile:  { path: '/profile',   label: 'your profile' },
};

// Navigate the store to one of the customer's account pages.
function toolOpenPage(page, session, onChunk) {
  const route = PAGE_ROUTES[String(page || '').toLowerCase().trim()];
  if (!route) {
    return { error: `Unknown page "${page}". Available pages: orders, cart, profile.` };
  }
  if (!session?.user_id) {
    return { error: 'The customer must be logged in to open their account pages. Ask them to log in first.' };
  }
  onChunk('', { action: 'navigate', path: route.path });
  return { opened: route.label, path: route.path };
}

// Pre-fill (NOT submit) the checkout shipping form with details from the customer.
function toolFillCheckout(args, session, onChunk) {
  if (!session?.user_id) {
    return { error: 'The customer must be logged in to use checkout. Ask them to log in first.' };
  }
  const address = {};
  for (const f of ['name', 'email', 'street', 'city', 'state', 'phone']) {
    if (args[f] != null && String(args[f]).trim()) address[f] = String(args[f]).trim();
  }
  const zip = args.pinCode ?? args.zip ?? args.postalCode ?? args.zipCode;
  if (zip != null && String(zip).trim()) address.pinCode = String(zip).trim();

  const paymentMethod = args.paymentMethod === 'card' || args.paymentMethod === 'cash' ? args.paymentMethod : null;

  if (!Object.keys(address).length && !paymentMethod) {
    return { error: 'No checkout details were provided to fill in.' };
  }
  onChunk('', { action: 'fill_checkout', address, paymentMethod });
  return {
    filled: Object.keys(address),
    paymentMethod,
    note: 'Pre-filled the checkout form for the customer. Remind them to review and place the order themselves — you must NOT place it.',
  };
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

// Aria's chat / "thinking" runs on Gemini via its OpenAI-compatible endpoint, so
// the existing OpenAI-style tool-calling loop below works unchanged. (Speech-to-text
// still uses Groq Whisper — see transcribeAudio.)
const GEMINI_CHAT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

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
  // price / budget words — never product-title search terms (note: NOT 'max'/'min',
  // which appear in real product names like "iPhone 15 Pro Max")
  'budget', 'budgets', 'within', 'price', 'cost', 'spend', 'spending', 'dollar',
  'dollars', 'usd', 'bucks', 'cheap', 'cheaper', 'cheapest', 'expensive', 'afford',
]);

/**
 * Resolves a free-text query (the user's message) against the real catalogue:
 *   - a single matching product   → { productId, title }   (open its page)
 *   - a brand / category / family → { filters: { brand:[], category:[] } }
 * "iPhone" → all products titled iPhone → brand Apple + category smartphones.
 */
async function resolveSearchFromMessage(message) {
  const words = (String(message || '').toLowerCase().match(/[a-z0-9]+/g) || [])
    // Drop pure numbers ("1000", "500") — those are prices/budgets, not catalogue
    // search terms, and would wrongly match model numbers in titles (e.g. "1000"
    // → "Sony WH-1000XM5"). The budget is handled separately by parseBudget.
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !SEARCH_STOPWORDS.has(w));
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

// Convert spelled-out numbers to digits so voice input like "five hundred" or
// "two thousand" is understood the same as "500" / "2000".
const NUM_ONES = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const NUM_TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const NUM_SCALES = { thousand: 1000, grand: 1000, million: 1000000 };
const NUM_WORD_LIST = [...Object.keys(NUM_ONES), ...Object.keys(NUM_TENS), ...Object.keys(NUM_SCALES), 'hundred', 'and']
  .sort((a, b) => b.length - a.length); // longest-first so "fourteen" wins over "four"
const NUM_RUN_RE = new RegExp(`\\b(?:${NUM_WORD_LIST.join('|')})(?:[\\s-]+(?:${NUM_WORD_LIST.join('|')}))*\\b`, 'gi');

function wordsToNumber(tokens) {
  let total = 0;
  let current = 0;
  let any = false;
  for (const w of tokens) {
    if (w === 'and') continue;
    if (NUM_ONES[w] != null) { current += NUM_ONES[w]; any = true; }
    else if (NUM_TENS[w] != null) { current += NUM_TENS[w]; any = true; }
    else if (w === 'hundred') { current = (current || 1) * 100; any = true; }
    else if (NUM_SCALES[w]) { total += (current || 1) * NUM_SCALES[w]; current = 0; any = true; }
    else return null;
  }
  return any ? total + current : null;
}

// Split a run of number-words into one or more numbers. "and" merges a sub-hundred
// remainder ("five hundred and fifty" = 550) but separates distinct numbers when the
// part after it has its own scale ("five hundred and one thousand" = 500 and 1000) —
// so spoken ranges stay intact for the range parser.
function runToNumbers(tokens) {
  const hasScale = (s) => s.some((w) => w === 'hundred' || NUM_SCALES[w]);
  const segments = [];
  let seg = [];
  for (const w of tokens) {
    if (w === 'and') { segments.push(seg); seg = []; } else seg.push(w);
  }
  segments.push(seg);
  const numbers = [];
  let cur = [];
  segments.forEach((s, i) => {
    if (!s.length) return;
    if (i > 0 && hasScale(s)) {
      if (cur.length) numbers.push(wordsToNumber(cur));
      cur = [...s];
    } else {
      cur.push(...s);
    }
  });
  if (cur.length) numbers.push(wordsToNumber(cur));
  return numbers.filter((n) => n != null);
}

function normalizeSpelledNumbers(text) {
  return text.replace(NUM_RUN_RE, (m) => {
    const toks = m.toLowerCase().split(/[\s-]+/).filter(Boolean);
    // Keep a boundary "and" that isn't part of the number (e.g. "five and dime").
    let prefix = '';
    let suffix = '';
    while (toks.length && toks[0] === 'and') { toks.shift(); prefix += 'and '; }
    while (toks.length && toks[toks.length - 1] === 'and') { toks.pop(); suffix = ` and${suffix}`; }
    if (!toks.length) return m;
    const nums = runToNumbers(toks);
    return nums.length ? `${prefix}${nums.join(' and ')}${suffix}` : m;
  });
}

// Parse a budget / price-range intent from the user's message. Spelled-out numbers
// (e.g. "under five hundred dollars") are normalized to digits first.
// Returns { minPrice, maxPrice } (either may be null) or null if no price found.
function parseBudget(message) {
  const text = normalizeSpelledNumbers(String(message || '').toLowerCase());
  const toNum = (s, k) => {
    let n = parseFloat(String(s).replace(/,/g, ''));
    if (k) n *= 1000; // "1.5k" → 1500
    return Number.isFinite(n) ? n : null;
  };
  const N = '(\\d[\\d,]*(?:\\.\\d+)?)\\s*(k)?';

  // Range: "$500 to $1000", "between 500 and 1000", "500-1000"
  let m =
    text.match(new RegExp(`\\$\\s*${N}\\s*(?:-|–|to|and)\\s*\\$?\\s*${N}`)) ||
    text.match(new RegExp(`between\\s*${N}\\s*(?:-|–|to|and)\\s*${N}`)) ||
    text.match(new RegExp(`from\\s*${N}\\s*(?:-|–|to|and)\\s*${N}`));
  if (m) {
    const a = toNum(m[1], m[2]);
    const b = toNum(m[3], m[4]);
    if (a !== null && b !== null) return { minPrice: Math.min(a, b), maxPrice: Math.max(a, b) };
  }

  // Max: "under 1000", "up to 1000", "my budget is 1000", "i can spend 1000", "max 1000"
  m = text.match(
    new RegExp(`(?:under|below|less than|up to|max(?:imum)?|within|cheaper than|no more than|at most|budget(?:\\s+(?:is about|of about|is|of|around|about|at))?|spend(?:ing)?)\\s*\\$?\\s*${N}`)
  );
  if (m) {
    const n = toNum(m[1], m[2]);
    if (n !== null) return { minPrice: null, maxPrice: n };
  }

  // Min: "over 500", "above 500", "at least 500", "starting from 500"
  m = text.match(
    new RegExp(`(?:over|above|more than|at least|min(?:imum)?|starting\\s*(?:from|at))\\s*\\$?\\s*${N}`)
  );
  if (m) {
    const n = toNum(m[1], m[2]);
    if (n !== null) return { minPrice: n, maxPrice: null };
  }

  // Bare dollar amount ("$200", "around $500") → treat as a max budget.
  m = text.match(new RegExp(`\\$\\s*${N}`));
  if (m) {
    const n = toNum(m[1], m[2]);
    if (n !== null) return { minPrice: null, maxPrice: n };
  }

  // Trailing currency ("1000$", "1000 dollars", "1k bucks") → treat as a max budget.
  m = text.match(new RegExp(`${N}\\s*(?:\\$|dollars?|usd|bucks)`));
  if (m) {
    const n = toNum(m[1], m[2]);
    if (n !== null) return { minPrice: null, maxPrice: n };
  }

  return null;
}

// Detect a request to OPEN an account page (orders / cart / profile), as opposed
// to a cart modification ("add to my cart") or a buy intent ("place an order").
// Returns 'orders' | 'cart' | 'profile' | null.
function parsePageIntent(message) {
  const text = String(message || '').toLowerCase();

  // Add/remove/buy/checkout verbs mean "change the cart" or "purchase", not
  // "open a page" — let the cart tools handle those.
  if (/\b(add|remove|delete|drop|put|buy|bought|purchase|checkout|order me|order a|order the)\b/.test(text)) {
    return null;
  }

  // A word that signals "take me there" / possessive ("my …").
  const wantsOpen = /\b(open|show|see|view|go|goto|take me|bring up|navigate|check|find|where|my)\b/.test(text);

  if (/\bmy orders?\b|\border history\b|\bmy purchases\b/.test(text) ||
      (wantsOpen && /\borders?\b/.test(text))) {
    return 'orders';
  }
  if (/\bmy cart\b|\bshopping cart\b|\bmy basket\b/.test(text) ||
      (wantsOpen && /\b(cart|basket)\b/.test(text))) {
    return 'cart';
  }
  if (/\bmy account\b|\bmy profile\b|\baccount settings\b/.test(text) ||
      (wantsOpen && /\b(profile|account)\b/.test(text))) {
    return 'profile';
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
  if (name === 'filter_products') {
    return toolFilterProducts(args, onChunk);
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
  if (name === 'fill_checkout') {
    return toolFillCheckout(args, session, onChunk);
  }
  if (name === 'add_to_cart') {
    const result = await toolAddToCart(session?.user_id, args.product_name || '', args.quantity || 1);
    if (result?.success) onChunk('', { action: 'cart_updated', tool: name, result });
    return result;
  }
  if (name === 'remove_from_cart') {
    const result = await toolRemoveFromCart(session?.user_id, args.product_name || '', args.confirmed === true);
    if (result?.success) onChunk('', { action: 'cart_updated', tool: name, result });
    return result;
  }
  if (name === 'update_cart_quantity') {
    const result = await toolUpdateCartQuantity(session?.user_id, args.product_name || '', args.quantity);
    if (result?.success) onChunk('', { action: 'cart_updated', tool: name, result });
    return result;
  }
  if (name === 'clear_cart') {
    const result = await toolClearCart(session?.user_id, args.confirmed === true);
    if (result?.success && result.cleared > 0) onChunk('', { action: 'cart_updated', tool: name, result });
    return result;
  }
  if (name === 'open_page') {
    return toolOpenPage(args.page || args.name || '', session, onChunk);
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
async function streamAgentResponse(sessionId, userMessage, onChunk) {
  if (!env.geminiApiKey) {
    throw new ApiError(500, 'Gemini API key is not configured');
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

  // Aria acts autonomously and may take several actions in one turn (e.g. filter
  // the store AND open a product), so there is no nav-lock — every action she or
  // the deterministic head-start below emits is forwarded to the client.
  const emit = onChunk;

  // Deterministic navigation/filtering from the user's message — works every
  // time, independent of the model's (sometimes wrong) tool choice.
  const CLEAR_INTENT = /\b(clear|reset)\b[\w\s'-]*\b(filter|filters|all)\b|\bremove\b[\w\s'-]*\bfilters?\b|\ball products\b|\ball items\b|\bshow everything\b|\bsee everything\b|\bgo back to all\b|\bno filters?\b/i;
  const CART_INTENT = /\b(add|cart|buy|buying|bought|purchase|checkout|order|remove|delete|drop)\b/i;

  // When the deterministic layer fully handles a turn (navigate / clear / open a
  // product / filter), we confirm with a friendly model-free reply and SKIP the LLM
  // below. That makes these common actions instant and reliable, and — crucially on
  // the free tier — spends ZERO model requests, so the tiny daily quota is reserved
  // for real conversation (questions, recommendations, cart changes).
  let deterministicReply = null;

  const pageIntent = parsePageIntent(userMessage);
  if (pageIntent) {
    // "show my orders" / "open my cart" / "go to my profile"
    const route = PAGE_ROUTES[pageIntent];
    if (session?.user_id) {
      emit('', { action: 'navigate', path: route.path });
      deterministicReply = `Sure — opening ${route.label} for you now.`;
    } else {
      deterministicReply = `You'll need to log in first before I can open ${route.label}.`;
    }
  } else if (CLEAR_INTENT.test(userMessage)) {
    // "clear filters" / "show all products" / "go back to all products"
    emit('', { action: 'apply_filters', category: [], brand: [] });
    deterministicReply = "Done — I've cleared the filters, so you're back to the full catalogue.";
  } else if (!CART_INTENT.test(userMessage)) {
    const budget = parseBudget(userMessage);
    const named = await findProductInMessage(userMessage);
    if (named) {
      emit('', { action: 'show_product', productId: named.id, title: named.title });
      deterministicReply = `Here's the ${named.title} — take a look!`;
    } else {
      const resolved = await resolveSearchFromMessage(userMessage);
      if (resolved?.productId) {
        emit('', { action: 'show_product', productId: resolved.productId, title: resolved.title });
        deterministicReply = `Here's the ${resolved.title} — take a look!`;
      } else {
        const filters = resolved?.filters || { brand: [], category: [] };
        const payload = { action: 'apply_filters', category: filters.category, brand: filters.brand };
        if (budget) {
          if (budget.minPrice !== null) payload.minPrice = budget.minPrice;
          if (budget.maxPrice !== null) payload.maxPrice = budget.maxPrice;
        }
        const hasBudget = budget && (budget.minPrice !== null || budget.maxPrice !== null);
        if (filters.brand.length || filters.category.length || hasBudget) {
          emit('', payload);
          // Natural confirmation, e.g. "Apple smartphones up to $1000".
          const desc = [];
          if (filters.brand.length) desc.push(filters.brand.join(' & '));
          if (filters.category.length) desc.push(filters.category.join(' & '));
          const priceBit =
            budget?.minPrice != null && budget?.maxPrice != null ? ` between $${budget.minPrice} and $${budget.maxPrice}`
            : budget?.maxPrice != null ? ` up to $${budget.maxPrice}`
            : budget?.minPrice != null ? ` from $${budget.minPrice}`
            : '';
          const phrase = desc.join(' ') || 'products';
          deterministicReply = `Here are the ${phrase}${priceBit} — take a look!`;
        }
      }
    }
  }

  // Action fully handled deterministically → confirm it WITHOUT spending a model
  // request. (Cart changes and open questions fall through to the model below.)
  if (deterministicReply) {
    for (const char of deterministicReply) onChunk(char);
    return deterministicReply;
  }

  const callModel = async (attempt = 0) => {
    const res = await fetch(GEMINI_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.geminiApiKey}` },
      body: JSON.stringify({
        model: env.geminiModel,
        messages,
        tools: SUPPORT_TOOLS,
        tool_choice: 'auto',
        max_tokens: 1024,
        temperature: 0.6,
        // gemini-2.5-flash is a "thinking" model; on the OpenAI-compat endpoint its
        // reasoning tokens are drawn from max_tokens and can leave the visible reply
        // EMPTY. Disable thinking so every turn returns real content (also faster /
        // lighter on the free-tier rate limit).
        reasoning_effort: 'none',
      }),
    });
    if (res.ok) return res.json();

    const errText = await res.text();
    let errObj = null;
    try { errObj = JSON.parse(errText); } catch { errObj = null; }
    const code = errObj?.error?.code;

    // Some models emit a malformed native tool call → recover by treating the
    // attempted generation as text, so handleLeakedToolCalls can run it.
    if (code === 'tool_use_failed' && errObj?.error?.failed_generation) {
      return {
        choices: [
          { finish_reason: 'stop', message: { role: 'assistant', content: errObj.error.failed_generation } },
        ],
      };
    }

    // Transient rate limit (HTTP 429) → wait the suggested time and retry once or twice.
    if (res.status === 429 && attempt < 2) {
      const wm = /(?:try again in|retry(?:\s+after)?)\s*([0-9.]+)\s*s/i.exec(errObj?.error?.message || '');
      const waitMs = wm ? Math.ceil(parseFloat(wm[1]) * 1000) + 200 : 1500;
      await new Promise((r) => setTimeout(r, waitMs));
      return callModel(attempt + 1);
    }

    throw new ApiError(502, `LLM API error: ${errText}`);
  };

  const MAX_ROUNDS = 8;

  try {
    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      const data = await callModel();
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
    const capped = "I've taken care of that. Is there anything else I can help you with?";
    for (const char of capped) onChunk(char);
    return capped;
  } catch (err) {
    // The model is unavailable — almost always the free-tier rate / daily quota.
    // Never surface a raw error: stream a friendly message so it still renders AND
    // is spoken, and Aria degrades gracefully instead of looking broken.
    const rateLimited = /\b429\b|quota|rate.?limit|exceeded/i.test(String(err?.message || ''));
    const friendly = rateLimited
      ? "I've hit the free plan's request limit for the moment — please give it a little while and try again."
      : "Sorry, I had a problem handling that one — could you try again?";
    for (const char of friendly) onChunk(char);
    return friendly;
  }
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
  streamAgentResponse,
  transcribeAudio,
};
