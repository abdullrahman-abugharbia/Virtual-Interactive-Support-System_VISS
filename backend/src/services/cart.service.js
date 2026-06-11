const ApiError = require('../utils/ApiError');
const cartModel = require('../models/cart.model');
const productModel = require('../models/product.model');

async function getCart(userId) {
  return cartModel.listCartItemsByUserId(userId);
}

async function addToCart(userId, payload) {
  const product = await productModel.findProductById(payload.product, {
    includeDeleted: true,
  });

  if (!product || product.deleted) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.stock <= 0) {
    throw new ApiError(400, 'Product is out of stock');
  }

  return cartModel.addCartItem(userId, {
    productId: payload.product,
    quantity: payload.quantity,
    color: payload.color,
    size: payload.size,
  });
}

async function updateCartItem(userId, itemId, payload) {
  const updated = await cartModel.updateCartItem(userId, itemId, payload);
  if (!updated) {
    throw new ApiError(404, 'Cart item not found');
  }

  return updated;
}

async function removeCartItem(userId, itemId) {
  const removed = await cartModel.removeCartItem(userId, itemId);
  if (!removed) {
    throw new ApiError(404, 'Cart item not found');
  }

  return true;
}

async function clearCart(userId) {
  await cartModel.clearCartByUserId(userId);
  return true;
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
