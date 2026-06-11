const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');

const getOwnUser = asyncHandler(async (req, res) => {
  const user = await userService.getOwnProfile(req.auth.id);
  res.status(200).json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.auth, req.params.id, req.body);
  res.status(200).json(user);
});

module.exports = {
  getOwnUser,
  updateUser,
};
