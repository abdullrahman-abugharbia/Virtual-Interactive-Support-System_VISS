const asyncHandler = require('../utils/asyncHandler');
const cartService = require('../services/cart.service');

const getMyCart = asyncHandler(async (req, res) => {
  const items = await cartService.getCart(req.auth.id);
  res.status(200).json(items);
});

const addToCart = asyncHandler(async (req, res) => {
  const item = await cartService.addToCart(req.auth.id, req.body);
  res.status(201).json(item);
});

const updateCartItem = asyncHandler(async (req, res) => {
  const item = await cartService.updateCartItem(req.auth.id, req.params.id, req.body);
  res.status(200).json(item);
});

const removeCartItem = asyncHandler(async (req, res) => {
  await cartService.removeCartItem(req.auth.id, req.params.id);
  res.status(200).json({ id: Number(req.params.id) });
});

module.exports = {
  getMyCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};
