const { parsePagination } = require('../utils/pagination');
const userService = require('./user.service');
const orderService = require('./order.service');

async function listUsers(query) {
  const { limit, offset } = parsePagination(query);
  const sort = query._sort || 'id';
  const order = String(query._order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return userService.listUsers({ limit, offset, sort, order });
}

async function listOrders(query) {
  const { limit, offset } = parsePagination(query);
  const sort = query._sort || 'id';
  const order = String(query._order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return orderService.getAllOrders({ limit, offset, sort, order });
}

module.exports = {
  listUsers,
  listOrders,
};
