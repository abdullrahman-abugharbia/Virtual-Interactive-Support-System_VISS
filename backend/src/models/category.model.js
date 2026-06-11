const { query } = require('../config/db');

function mapCategory(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    value: row.value,
    label: row.label,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listCategories() {
  const { rows } = await query('SELECT * FROM categories ORDER BY label ASC');
  return rows.map(mapCategory);
}

async function findCategoryById(id) {
  const { rows } = await query('SELECT * FROM categories WHERE id = $1 LIMIT 1', [id]);
  return mapCategory(rows[0]);
}

async function findCategoryByValue(value) {
  const { rows } = await query('SELECT * FROM categories WHERE value = $1 LIMIT 1', [value]);
  return mapCategory(rows[0]);
}

async function createCategory({ value, label, description = null }) {
  const { rows } = await query(
    `
      INSERT INTO categories (value, label, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [value, label, description]
  );
  return mapCategory(rows[0]);
}

async function updateCategory(id, updates) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (updates.value !== undefined) {
    setClauses.push(`value = $${idx++}`);
    values.push(updates.value);
  }
  if (updates.label !== undefined) {
    setClauses.push(`label = $${idx++}`);
    values.push(updates.label);
  }
  if (updates.description !== undefined) {
    setClauses.push(`description = $${idx++}`);
    values.push(updates.description);
  }

  if (!setClauses.length) {
    return findCategoryById(id);
  }

  values.push(id);
  const { rows } = await query(
    `
      UPDATE categories
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `,
    values
  );

  return mapCategory(rows[0]);
}

async function deleteCategory(id) {
  const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = {
  listCategories,
  findCategoryById,
  findCategoryByValue,
  createCategory,
  updateCategory,
  deleteCategory,
};
