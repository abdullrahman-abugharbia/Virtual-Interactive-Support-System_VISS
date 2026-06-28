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
    tags: row.tags || [],
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
        deleted,
        tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
      payload.tags || [],
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
  if (payload.tags !== undefined) apply('tags', payload.tags);

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
  search = '',
  minPrice = null,
  maxPrice = null,
}) {
  const filters = [];
  const params = [];
  let idx = 1;

  if (!includeDeleted) {
    filters.push('p.deleted = FALSE');
  }

  // Categories combine with AND: every selected category must match the product —
  // by its primary category, by an extra category in its tags[], or as a keyword in
  // its name/label. So "gaming" + "laptops" returns gaming laptops (laptops tagged
  // "gaming"), not all gaming items + all laptops. A single category is a plain
  // primary-or-tag match.
  if (categories.length === 1) {
    filters.push(`(c.value = $${idx} OR $${idx} = ANY(p.tags))`);
    params.push(categories[0]);
    idx += 1;
  } else if (categories.length > 1) {
    for (const cat of categories) {
      filters.push(
        `(c.value = $${idx} OR $${idx} = ANY(p.tags) OR p.title ILIKE $${idx + 1} OR c.label ILIKE $${idx + 1})`
      );
      params.push(cat, `%${cat}%`);
      idx += 2;
    }
  }

  // Brands stay OR (any of the selected) — a product has only one brand, so
  // AND-ing brands would always return nothing.
  if (brands.length) {
    filters.push(`p.brand = ANY($${idx++}::text[])`);
    params.push(brands);
  }

  // Free-text search: every token must appear in the product name, brand, category,
  // or one of its tags. Tags are what let a product match terms not in its name —
  // e.g. "gaming laptop" finds laptops tagged "gaming". Description is intentionally
  // excluded — matching it returns noise (e.g. phones mentioning "camera" in their
  // description for a "camera" search).
  if (search) {
    const tokens = String(search).split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      filters.push(
        `(p.title ILIKE $${idx} OR p.brand ILIKE $${idx} OR c.value ILIKE $${idx} OR c.label ILIKE $${idx} OR array_to_string(p.tags, ' ') ILIKE $${idx})`
      );
      params.push(`%${token}%`);
      idx += 1;
    }
  }

  // Price range (on the actual selling price / discount_price).
  if (minPrice !== null && minPrice !== undefined) {
    filters.push(`p.discount_price >= $${idx}`);
    params.push(minPrice);
    idx += 1;
  }
  if (maxPrice !== null && maxPrice !== undefined) {
    filters.push(`p.discount_price <= $${idx}`);
    params.push(maxPrice);
    idx += 1;
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
