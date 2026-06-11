const ApiError = require('../utils/ApiError');
const { withTransaction } = require('../config/db');
const orderModel = require('../models/order.model');
const cartModel = require('../models/cart.model');

function normalizePaymentMethod(value) {
  const method = String(value || 'cash').toLowerCase();
  if (!['cash', 'card'].includes(method)) {
    throw new ApiError(400, 'Invalid payment method');
  }
  return method;
}

async function createOrderFromCart(userId, payload) {
  if (!payload.selectedAddress || typeof payload.selectedAddress !== 'object') {
    throw new ApiError(400, 'selectedAddress is required');
  }

  const paymentMethod = normalizePaymentMethod(payload.paymentMethod);

  return withTransaction(async (client) => {
    const cartItems = await cartModel.listCartItemsByUserId(userId, client);

    if (!cartItems.length) {
      throw new ApiError(400, 'Cart is empty');
    }

    const totalAmount = Number(
      cartItems
        .reduce((sum, item) => sum + Number(item.product.discountPrice) * Number(item.quantity), 0)
        .toFixed(2)
    );

    const totalItems = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0);

    const order = await orderModel.createOrder(
      {
        userId,
        status: payload.status || 'pending',
        paymentMethod,
        paymentStatus: payload.paymentStatus || 'pending',
        totalAmount,
        totalItems,
        selectedAddress: payload.selectedAddress,
      },
      client
    );

    for (const cartItem of cartItems) {
      await orderModel.addOrderItem(
        {
          orderId: order.id,
          productId: cartItem.product.id,
          quantity: cartItem.quantity,
          unitPrice: cartItem.product.price,
          discountPrice: cartItem.product.discountPrice,
          snapshotTitle: cartItem.product.title,
          snapshotBrand: cartItem.product.brand,
          snapshotThumbnail: cartItem.product.thumbnail,
        },
        client
      );
    }

    await cartModel.clearCartByUserId(userId, client);

    return orderModel.findOrderById(order.id, client);
  });
}

async function getOwnOrders(userId) {
  return orderModel.listOrdersByUserId(userId);
}

async function getOrderById(orderId, currentUser) {
  const order = await orderModel.findOrderById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (currentUser.role !== 'admin' && Number(order.user) !== Number(currentUser.id)) {
    throw new ApiError(403, 'Access denied for this order');
  }

  return order;
}

async function getAllOrders({ limit, offset, sort, order }) {
  return orderModel.listAllOrders({ limit, offset, sort, order });
}

async function updateOrder(orderId, updates) {
  const updated = await orderModel.updateOrder(orderId, updates);
  if (!updated) {
    throw new ApiError(404, 'Order not found');
  }
  return updated;
}

module.exports = {
  createOrderFromCart,
  getOwnOrders,
  getOrderById,
  getAllOrders,
  updateOrder,
};
