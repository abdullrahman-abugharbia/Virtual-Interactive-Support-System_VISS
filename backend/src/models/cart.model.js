const { query } = require('../config/db');

async function dbQuery(dbClient, text, params = []) {
  if (dbClient) {
    return dbClient.query(text, params);
  }
  return query(text, params);
}

function mapCartItem(row) {
  if (!row) return null;

  return {
    id: Number(row.cart_item_id),
    quantity: Number(row.quantity),
    color: row.color || null,
    size: row.size || null,
    product: {
      id: Number(row.product_id),
      title: row.product_title,
      description: row.product_description,
      price: Number(row.product_price),
      discountPercentage: Number(row.product_discount_percentage),
      discountPrice: Number(row.product_discount_price),
      rating: Number(row.product_rating),
      stock: Number(row.product_stock),
      brand: row.product_brand,
      category: row.category_value || null,
      thumbnail: row.product_thumbnail,
      images: row.product_images || [],
      highlights: row.product_highlights || [],
      colors: row.product_colors || [],
      sizes: row.product_sizes || [],
      deleted: row.product_deleted,
    },
    createdAt: row.cart_item_created_at,
    updatedAt: row.cart_item_updated_at,
  };
}

async function getOrCreateCart(userId, dbClient = null) {
  const { rows: existingRows } = await dbQuery(
    dbClient,
    'SELECT * FROM carts WHERE user_id = $1 LIMIT 1',
    [userId]
  );

  if (existingRows[0]) return existingRows[0];

  const { rows } = await dbQuery(
    dbClient,
    'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
    [userId]
  );

  return rows[0];
}

async function listCartItemsByUserId(userId, dbClient = null) {
  await getOrCreateCart(userId, dbClient);

  const { rows } = await dbQuery(
    dbClient,
    `
      SELECT
        ci.id AS cart_item_id,
        ci.quantity,
        ci.color,
        ci.size,
        ci.created_at AS cart_item_created_at,
        ci.updated_at AS cart_item_updated_at,

        p.id AS product_id,
        p.title AS product_title,
        p.description AS product_description,
        p.price AS product_price,
        p.discount_percentage AS product_discount_percentage,
        p.discount_price AS product_discount_price,
        p.rating AS product_rating,
        p.stock AS product_stock,
        p.brand AS product_brand,
        p.thumbnail AS product_thumbnail,
        p.images AS product_images,
        p.highlights AS product_highlights,
        p.colors AS product_colors,
        p.sizes AS product_sizes,
        p.deleted AS product_deleted,

        c.value AS category_value
      FROM carts cart
      INNER JOIN cart_items ci ON ci.cart_id = cart.id
      INNER JOIN products p ON p.id = ci.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE cart.user_id = $1
      ORDER BY ci.id ASC
    `,
    [userId]
  );

  return rows.map(mapCartItem);
}

async function findCartItemByUser(userId, itemId, dbClient = null) {
  const { rows } = await dbQuery(
    dbClient,
    `
      SELECT
        ci.id AS cart_item_id,
        ci.quantity,
        ci.color,
        ci.size,
        ci.created_at AS cart_item_created_at,
        ci.updated_at AS cart_item_updated_at,

        p.id AS product_id,
        p.title AS product_title,
        p.description AS product_description,
        p.price AS product_price,
        p.discount_percentage AS product_discount_percentage,
        p.discount_price AS product_discount_price,
        p.rating AS product_rating,
        p.stock AS product_stock,
        p.brand AS product_brand,
        p.thumbnail AS product_thumbnail,
        p.images AS product_images,
        p.highlights AS product_highlights,
        p.colors AS product_colors,
        p.sizes AS product_sizes,
        p.deleted AS product_deleted,

        c.value AS category_value
      FROM carts cart
      INNER JOIN cart_items ci ON ci.cart_id = cart.id
      INNER JOIN products p ON p.id = ci.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE cart.user_id = $1 AND ci.id = $2
      LIMIT 1
    `,
    [userId, itemId]
  );

  return mapCartItem(rows[0]);
}

async function addCartItem(userId, { productId, quantity, color = null, size = null }, dbClient = null) {
  const cart = await getOrCreateCart(userId, dbClient);

  const { rows } = await dbQuery(
    dbClient,
    `
      INSERT INTO cart_items (cart_id, product_id, quantity, color, size)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (cart_id, product_id)
      DO UPDATE
      SET
        quantity = cart_items.quantity + EXCLUDED.quantity,
        color = COALESCE(EXCLUDED.color, cart_items.color),
        size = COALESCE(EXCLUDED.size, cart_items.size),
        updated_at = NOW()
      RETURNING id
    `,
    [cart.id, productId, quantity, color, size]
  );

  return findCartItemByUser(userId, rows[0].id, dbClient);
}

async function updateCartItem(userId, itemId, { quantity, color, size }, dbClient = null) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (quantity !== undefined) {
    setClauses.push(`quantity = $${idx++}`);
    values.push(quantity);
  }
  if (color !== undefined) {
    setClauses.push(`color = $${idx++}`);
    values.push(color);
  }
  if (size !== undefined) {
    setClauses.push(`size = $${idx++}`);
    values.push(size);
  }

  if (!setClauses.length) {
    return findCartItemByUser(userId, itemId, dbClient);
  }

  values.push(itemId, userId);

  const { rows } = await dbQuery(
    dbClient,
    `
      UPDATE cart_items ci
      SET ${setClauses.join(', ')}, updated_at = NOW()
      FROM carts cart
      WHERE ci.id = $${idx++}
        AND ci.cart_id = cart.id
        AND cart.user_id = $${idx}
      RETURNING ci.id
    `,
    values
  );

  if (!rows[0]) {
    return null;
  }

  return findCartItemByUser(userId, rows[0].id, dbClient);
}

async function removeCartItem(userId, itemId, dbClient = null) {
  const { rowCount } = await dbQuery(
    dbClient,
    `
      DELETE FROM cart_items ci
      USING carts cart
      WHERE ci.id = $1
        AND ci.cart_id = cart.id
        AND cart.user_id = $2
    `,
    [itemId, userId]
  );

  return rowCount > 0;
}

async function clearCartByUserId(userId, dbClient = null) {
  await getOrCreateCart(userId, dbClient);

  const { rowCount } = await dbQuery(
    dbClient,
    `
      DELETE FROM cart_items ci
      USING carts cart
      WHERE ci.cart_id = cart.id
        AND cart.user_id = $1
    `,
    [userId]
  );

  return rowCount;
}

module.exports = {
  getOrCreateCart,
  listCartItemsByUserId,
  findCartItemByUser,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartByUserId,
  mapCartItem,
};
