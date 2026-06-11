const { query } = require('../config/db');

function mapUserPublic(row) {
  if (!row) return null;
  let addresses = row.addresses || [];
  if (typeof addresses === 'string') {
    try { addresses = JSON.parse(addresses); } catch { addresses = []; }
  }
  if (!Array.isArray(addresses)) addresses = [];
  return {
    id: Number(row.id),
    email: row.email,
    name: row.name,
    role: row.role,
    addresses,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserWithPassword(row) {
  if (!row) return null;
  return {
    ...mapUserPublic(row),
    passwordHash: row.password_hash,
  };
}

async function createUser({ email, passwordHash, name = null, role = 'user', addresses = [] }) {
  const { rows } = await query(
    `
      INSERT INTO users (email, password_hash, name, role, addresses)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [email, passwordHash, name, role, addresses]
  );

  return mapUserPublic(rows[0]);
}

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return mapUserWithPassword(rows[0]);
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return mapUserPublic(rows[0]);
}

async function findByIdWithPassword(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return mapUserWithPassword(rows[0]);
}

async function updateUser(id, updates) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (updates.email !== undefined) {
    setClauses.push(`email = $${idx++}`);
    values.push(updates.email);
  }
  if (updates.name !== undefined) {
    setClauses.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.role !== undefined) {
    setClauses.push(`role = $${idx++}`);
    values.push(updates.role);
  }
  if (updates.addresses !== undefined) {
    setClauses.push(`addresses = $${idx++}`);
    values.push(JSON.stringify(updates.addresses));
  }
  if (updates.isActive !== undefined) {
    setClauses.push(`is_active = $${idx++}`);
    values.push(updates.isActive);
  }

  if (!setClauses.length) {
    return findById(id);
  }

  values.push(id);

  const { rows } = await query(
    `
      UPDATE users
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `,
    values
  );

  return mapUserPublic(rows[0]);
}

async function listUsers({ limit, offset, sort = 'id', order = 'ASC' }) {
  const validSortFields = {
    id: 'id',
    email: 'email',
    role: 'role',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };

  const dbSort = validSortFields[sort] || 'id';
  const dbOrder = order === 'DESC' ? 'DESC' : 'ASC';

  const [{ rows: users }, { rows: countRows }] = await Promise.all([
    query(
      `
        SELECT *
        FROM users
        ORDER BY ${dbSort} ${dbOrder}
        LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    ),
    query('SELECT COUNT(*)::int AS total FROM users'),
  ]);

  return {
    users: users.map(mapUserPublic),
    total: countRows[0].total,
  };
}

async function updatePasswordByEmail(email, passwordHash) {
  const { rows } = await query(
    `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE email = $2
      RETURNING *
    `,
    [passwordHash, email]
  );

  return mapUserPublic(rows[0]);
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  findByIdWithPassword,
  updateUser,
  listUsers,
  updatePasswordByEmail,
  mapUserPublic,
};
