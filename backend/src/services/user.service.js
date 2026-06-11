const ApiError = require('../utils/ApiError');
const userModel = require('../models/user.model');

async function getOwnProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
}

async function updateUser(currentUser, targetUserId, payload) {
  const isAdmin = currentUser.role === 'admin';

  if (!isAdmin && Number(currentUser.id) !== Number(targetUserId)) {
    throw new ApiError(403, 'You can only update your own profile');
  }

  const existing = await userModel.findById(targetUserId);
  if (!existing) {
    throw new ApiError(404, 'User not found');
  }

  const safePayload = {};

  if (payload.email !== undefined) safePayload.email = payload.email;
  if (payload.name !== undefined) safePayload.name = payload.name;
  if (payload.addresses !== undefined) safePayload.addresses = payload.addresses;

  if (isAdmin) {
    if (payload.role !== undefined) safePayload.role = payload.role;
    if (payload.isActive !== undefined) safePayload.isActive = payload.isActive;
  }

  return userModel.updateUser(targetUserId, safePayload);
}

async function listUsers({ limit, offset, sort, order }) {
  return userModel.listUsers({ limit, offset, sort, order });
}

module.exports = {
  getOwnProfile,
  updateUser,
  listUsers,
};
