const { query } = require('../config/db');

function computeDiscountPrice(price, discountPercentage = 0) {
  const discounted = Number(price) * (1 - Number(discountPercentage || 0) / 100);
  return Number(discounted.toFixed(2));
}

function toTitleCaseFromValue(value) {
  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function ensureCategoryByValue(categoryValue) {
  if (!categoryValue) return null;

  const { rows: existingRows } = await query(
    'SELECT id FROM categories WHERE value = $1 LIMIT 1',
    [categoryValue]
  );

  if (existingRows[0]) {
    return Number(existingRows[0].id);
  }

  const label = toTitleCaseFromValue(categoryValue);
  const { rows } = await query(
    `
      INSERT INTO categories (value, label)
      VALUES ($1, $2)
      RETURNING id
    `,
    [categoryValue, label]
  );

  return Number(rows[0].id);
}

function mapProduct(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    price: Number(row.price),
    discountPercentage: Number(row.discount_percentage),
    discountPrice: Number(row.discount_price),
    rating: Number(row.rating),
    stock: Number(row.stock),
    brand: row.brand,
    category: row.category_value || null,
    thumbnail: row.thumbnail,
    images: row.images || [],
    highlights: row.highlights || [],
    colors: row.colors || [],
    sizes: row.sizes || [],
    deleted: row.deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createProduct(payload) {
  const categoryId = await ensureCategoryByValue(payload.category || null);
  const discountPrice =
    payload.discountPrice !== undefined
      ? Number(payload.discountPrice)
      : computeDiscountPrice(payload.price, payload.discountPercentage);

  const { rows } = await query(
    `
      INSERT INTO products (
        title,
        description,
        price,
        discount_percentage,
        discount_price,
        rating,
        stock,
        brand,
        category_id,
        thumbnail,
        images,
        highlights,
        colors,
        sizes,
        deleted
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `,
    [
      payload.title,
      payload.description,
      payload.price,
      payload.discountPercentage || 0,
      discountPrice,
      payload.rating || 0,
      payload.stock,
      payload.brand,
      categoryId,
      payload.thumbnail || payload.images?.[0] || '',
      payload.images || [],
      payload.highlights || [],
      payload.colors || [],
      payload.sizes || [],
      Boolean(payload.deleted),
    ]
  );

  return findProductById(rows[0].id, { includeDeleted: true });
}

async function updateProduct(id, payload) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  const apply = (column, value) => {
    setClauses.push(`${column} = $${idx++}`);
    values.push(value);
  };

  if (payload.title !== undefined) apply('title', payload.title);
  if (payload.description !== undefined) apply('description', payload.description);
  if (payload.price !== undefined) apply('price', payload.price);
  if (payload.discountPercentage !== undefined)
    apply('discount_percentage', payload.discountPercentage);
  if (payload.rating !== undefined) apply('rating', payload.rating);
  if (payload.stock !== undefined) apply('stock', payload.stock);
  if (payload.brand !== undefined) apply('brand', payload.brand);
  if (payload.thumbnail !== undefined) apply('thumbnail', payload.thumbnail);
  if (payload.images !== undefined) apply('images', payload.images);
  if (payload.highlights !== undefined) apply('highlights', payload.highlights);
  if (payload.colors !== undefined) apply('colors', payload.colors);
  if (payload.sizes !== undefined) apply('sizes', payload.sizes);
  if (payload.deleted !== undefined) apply('deleted', Boolean(payload.deleted));

  if (payload.category !== undefined) {
    const categoryId = await ensureCategoryByValue(payload.category || null);
    apply('category_id', categoryId);
  }

  const shouldRecomputeDiscountPrice =
    payload.price !== undefined || payload.discountPercentage !== undefined;

  if (payload.discountPrice !== undefined) {
    apply('discount_price', payload.discountPrice);
  } else if (shouldRecomputeDiscountPrice) {
    const current = await findProductById(id, { includeDeleted: true });
    if (current) {
      const nextPrice = payload.price !== undefined ? payload.price : current.price;
      const nextDiscount =
        payload.discountPercentage !== undefined
          ? payload.discountPercentage
          : current.discountPercentage;
      apply('discount_price', computeDiscountPrice(nextPrice, nextDiscount));
    }
  }

  if (!setClauses.length) {
    return findProductById(id, { includeDeleted: true });
  }

  values.push(id);

  const { rows } = await query(
    `
      UPDATE products
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id
    `,
    values
  );

  if (!rows[0]) return null;
  return findProductById(rows[0].id, { includeDeleted: true });
}

async function findProductById(id, { includeDeleted = false } = {}) {
  const conditions = ['p.id = $1'];
  if (!includeDeleted) conditions.push('p.deleted = FALSE');

  const { rows } = await query(
    `
      SELECT
        p.*,
        c.value AS category_value
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${conditions.join(' AND ')}
      LIMIT 1
    `,
    [id]
  );

  return mapProduct(rows[0]);
}

async function listProducts({
  categories = [],
  brands = [],
  includeDeleted = false,
  sort = 'id',
  order = 'ASC',
  limit = 12,
  offset = 0,
}) {
  const filters = [];
  const params = [];
  let idx = 1;

  if (!includeDeleted) {
    filters.push('p.deleted = FALSE');
  }

  if (categories.length) {
    filters.push(`c.value = ANY($${idx++}::text[])`);
    params.push(categories);
  }

  if (brands.length) {
    filters.push(`p.brand = ANY($${idx++}::text[])`);
    params.push(brands);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const sortMap = {
    id: 'p.id',
    title: 'p.title',
    price: 'p.price',
    discountPrice: 'p.discount_price',
    discountPercentage: 'p.discount_percentage',
    rating: 'p.rating',
    stock: 'p.stock',
    createdAt: 'p.created_at',
    updatedAt: 'p.updated_at',
  };

  const dbSort = sortMap[sort] || 'p.id';
  const dbOrder = order === 'DESC' ? 'DESC' : 'ASC';

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${whereClause}
  `;

  const dataSql = `
    SELECT
      p.*,
      c.value AS category_value
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${whereClause}
    ORDER BY ${dbSort} ${dbOrder}
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const countParams = [...params];
  const dataParams = [...params, limit, offset];

  const [{ rows: countRows }, { rows: dataRows }] = await Promise.all([
    query(countSql, countParams),
    query(dataSql, dataParams),
  ]);

  return {
    items: dataRows.map(mapProduct),
    total: countRows[0].total,
  };
}

async function listBrands() {
  const { rows } = await query(
    `
      SELECT DISTINCT brand
      FROM products
      WHERE deleted = FALSE
      ORDER BY brand ASC
    `
  );

  return rows.map((row) => ({
    value: row.brand,
    label: row.brand,
  }));
}

module.exports = {
  createProduct,
  updateProduct,
  findProductById,
  listProducts,
  listBrands,
  mapProduct,
};
