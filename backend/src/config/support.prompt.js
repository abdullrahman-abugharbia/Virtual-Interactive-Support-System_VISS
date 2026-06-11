const CAPABILITIES = `
You can use tools to:
- search_products: search the store catalogue
- add_to_cart: add a product to the user's cart (logged-in users only)
- remove_from_cart: remove a product from the user's cart (logged-in users only)
Use tools proactively when a user asks to find, add, or remove products.
Keep replies concise — no more than 3 sentences. Be warm and professional.`;

function buildSystemPrompt(userContext) {
  if (!userContext) {
    return `You are Aria, a friendly and professional customer support agent for our eCommerce store.
You help customers with: order status, returns and refunds, product questions, account issues, and shipping inquiries.
${CAPABILITIES}`;
  }

  const { user, orders, cartItems } = userContext;

  const ordersText = orders.length === 0
    ? 'No recent orders.'
    : orders.map((o) => {
        const itemList = (o.items || [])
          .map((i) => `${i.title} x${i.qty} ($${Number(i.price).toFixed(2)})`)
          .join(', ');
        return `• Order #${o.id} — ${o.status} — $${Number(o.total_amount).toFixed(2)}${itemList ? ` (${itemList})` : ''}`;
      }).join('\n');

  const cartText = cartItems.length === 0
    ? 'Cart is empty.'
    : cartItems.map((c) => `${c.title} x${c.quantity} ($${Number(c.discount_price).toFixed(2)})`).join(', ');

  return `You are Aria, a friendly and professional customer support agent for our eCommerce store.

CUSTOMER CONTEXT:
- Name: ${user.name}
- Email: ${user.email}
- Recent orders:
${ordersText}
- Current cart: ${cartText}

Address the customer by their first name.
${CAPABILITIES}`;
}

module.exports = { buildSystemPrompt };
