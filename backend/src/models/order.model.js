const { query } = require('../config/db');

async function dbQuery(dbClient, text, params = []) {
  if (dbClient) {
    return dbClient.query(text, params);
  }
  return query(text, params);
}

function mapOrder(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    user: Number(row.user_id),
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    totalAmount: Number(row.total_amount),
    totalItems: Number(row.total_items),
    selectedAddress: row.selected_address || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderItem(row) {
  return {
    id: Number(row.order_item_id),
    quantity: Number(row.quantity),
    product: {
      id: row.product_id ? Number(row.product_id) : null,
      title: row.product_title,
      description: row.product_description || '',
      price: Number(row.unit_price),
      discountPrice: Number(row.discount_price),
      discountPercentage:
        Number(row.unit_price) > 0
          ? Number((((Number(row.unit_price) - Number(row.discount_price)) / Number(row.unit_price)) * 100).toFixed(2))
          : 0,
      rating: row.product_rating !== null && row.product_rating !== undefined ? Number(row.product_rating) : 0,
      stock: row.product_stock !== null && row.product_stock !== undefined ? Number(row.product_stock) : 0,
      brand: row.product_brand,
      category: row.category_value || null,
      thumbnail: row.product_thumbnail,
      images: row.product_images || [],
      highlights: row.product_highlights || [],
      colors: row.product_colors || [],
      sizes: row.product_sizes || [],
      deleted: row.product_deleted ?? false,
    },
  };
}

async function createOrder(data, dbClient = null) {
  const { rows } = await dbQuery(
    dbClient,
    `
      INSERT INTO orders (
        user_id,
        status,
        payment_method,
        payment_status,
        total_amount,
        total_items,
        selected_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      data.userId,
      data.status || 'pending',
      data.paymentMethod || 'cash',
      data.paymentStatus || 'pending',
      data.totalAmount,
      data.totalItems,
      data.selectedAddress,
    ]
  );

  return mapOrder(rows[0]);
}

async function addOrderItem(data, dbClient = null) {
  const { rows } = await dbQuery(
    dbClient,
    `
      INSERT INTO order_items (
        order_id,
        product_id,
        quantity,
        unit_price,
        discount_price,
        snapshot_title,
        snapshot_brand,
        snapshot_thumbnail
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [
      data.orderId,
      data.productId,
      data.quantity,
      data.unitPrice,
      data.discountPrice,
      data.snapshotTitle,
      data.snapshotBrand,
      data.snapshotThumbnail,
    ]
  );

  return Number(rows[0].id);
}

async function listOrderItems(orderIds, dbClient = null) {
  if (!orderIds.length) return new Map();

  const { rows } = await dbQuery(
    dbClient,
    `
      SELECT
        oi.id AS order_item_id,
        oi.order_id,
        oi.quantity,
        oi.unit_price,
        oi.discount_price,

        COALESCE(p.id, oi.product_id) AS product_id,
        COALESCE(p.title, oi.snapshot_title) AS product_title,
        p.description AS product_description,
        p.rating AS product_rating,
        p.stock AS product_stock,
        COALESCE(p.brand, oi.snapshot_brand) AS product_brand,
        COALESCE(p.thumbnail, oi.snapshot_thumbnail) AS product_thumbnail,
        p.images AS product_images,
        p.highlights AS product_highlights,
        p.colors AS product_colors,
        p.sizes AS product_sizes,
        p.deleted AS product_deleted,
        c.value AS category_value
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE oi.order_id = ANY($1::bigint[])
      ORDER BY oi.id ASC
    `,
    [orderIds]
  );

  const grouped = new Map();
  for (const row of rows) {
    const orderId = Number(row.order_id);
    const item = mapOrderItem(row);
    if (!grouped.has(orderId)) {
      grouped.set(orderId, []);
    }
    grouped.get(orderId).push(item);
  }

  return grouped;
}

async function findOrderById(orderId, dbClient = null) {
  const { rows } = await dbQuery(dbClient, 'SELECT * FROM orders WHERE id = $1 LIMIT 1', [orderId]);
  const order = mapOrder(rows[0]);
  if (!order) return null;

  const itemsMap = await listOrderItems([order.id], dbClient);
  order.items = itemsMap.get(order.id) || [];
  return order;
}

async function listOrdersByUserId(userId, dbClient = null) {
  const { rows } = await dbQuery(
    dbClient,
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

  const orders = rows.map(mapOrder);
  const ids = orders.map((order) => order.id);
  const itemsMap = await listOrderItems(ids, dbClient);

  return orders.map((order) => ({
    ...order,
    items: itemsMap.get(order.id) || [],
  }));
}

async function listAllOrders({ limit, offset, sort = 'id', order = 'ASC' }, dbClient = null) {
  const sortMap = {
    id: 'id',
    totalAmount: 'total_amount',
    status: 'status',
    paymentStatus: 'payment_status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };

  const dbSort = sortMap[sort] || 'id';
  const dbOrder = order === 'DESC' ? 'DESC' : 'ASC';

  const [{ rows }, { rows: countRows }] = await Promise.all([
    dbQuery(
      dbClient,
      `
        SELECT *
        FROM orders
        ORDER BY ${dbSort} ${dbOrder}
        LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    ),
    dbQuery(dbClient, 'SELECT COUNT(*)::int AS total FROM orders'),
  ]);

  const orders = rows.map(mapOrder);
  const ids = orders.map((o) => o.id);
  const itemsMap = await listOrderItems(ids, dbClient);

  return {
    orders: orders.map((orderRow) => ({
      ...orderRow,
      items: itemsMap.get(orderRow.id) || [],
    })),
    total: countRows[0].total,
  };
}

async function updateOrder(orderId, updates, dbClient = null) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (updates.status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    values.push(updates.status);
  }
  if (updates.paymentMethod !== undefined) {
    setClauses.push(`payment_method = $${idx++}`);
    values.push(updates.paymentMethod);
  }
  if (updates.paymentStatus !== undefined) {
    setClauses.push(`payment_status = $${idx++}`);
    values.push(updates.paymentStatus);
  }
  if (updates.selectedAddress !== undefined) {
    setClauses.push(`selected_address = $${idx++}`);
    values.push(updates.selectedAddress);
  }

  if (!setClauses.length) {
    return findOrderById(orderId, dbClient);
  }

  values.push(orderId);

  const { rows } = await dbQuery(
    dbClient,
    `
      UPDATE orders
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id
    `,
    values
  );

  if (!rows[0]) {
    return null;
  }

  return findOrderById(rows[0].id, dbClient);
}

module.exports = {
  createOrder,
  addOrderItem,
  findOrderById,
  listOrdersByUserId,
  listAllOrders,
  updateOrder,
};
