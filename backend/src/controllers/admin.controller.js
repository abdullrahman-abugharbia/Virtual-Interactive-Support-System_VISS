const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');
const userService = require('../services/user.service');
const orderService = require('../services/order.service');

const listUsers = asyncHandler(async (req, res) => {
  const { users, total } = await adminService.listUsers(req.query);
  res.set('X-Total-Count', String(total));
  res.status(200).json(users);
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.auth, req.params.id, req.body);
  res.status(200).json(user);
});

const listOrders = asyncHandler(async (req, res) => {
  const { orders, total } = await adminService.listOrders(req.query);
  res.set('X-Total-Count', String(total));
  res.status(200).json(orders);
});

const updateOrderByAdmin = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrder(req.params.id, req.body);
  res.status(200).json(order);
});

module.exports = {
  listUsers,
  updateUserByAdmin,
  listOrders,
  updateOrderByAdmin,
};
