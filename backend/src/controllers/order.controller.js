const asyncHandler = require('../utils/asyncHandler');
const orderService = require('../services/order.service');
const { parsePagination } = require('../utils/pagination');

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrderFromCart(req.auth.id, req.body);
  res.status(201).json(order);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getOwnOrders(req.auth.id);
  res.status(200).json(orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.auth);
  res.status(200).json(order);
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { limit, offset } = parsePagination(req.query);
  const sort = req.query._sort || 'id';
  const order = String(req.query._order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const data = await orderService.getAllOrders({ limit, offset, sort, order });
  res.set('X-Total-Count', String(data.total));
  res.status(200).json(data.orders);
});

const updateOrder = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrder(req.params.id, req.body);
  res.status(200).json(order);
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrder,
};
