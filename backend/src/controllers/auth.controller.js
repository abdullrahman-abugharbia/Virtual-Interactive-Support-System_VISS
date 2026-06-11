const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const { setAuthCookie, clearAuthCookie } = require('../services/token.service');

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  setAuthCookie(res, token);
  res.status(201).json(user);
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  setAuthCookie(res, token);
  res.status(200).json(user);
});

const check = asyncHandler(async (req, res) => {
  const user = await authService.checkAuth(req.auth.id);
  res.status(200).json(user);
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: 'success' });
});

const resetPasswordRequest = asyncHandler(async (req, res) => {
  const data = await authService.requestPasswordReset(req.body.email);
  res.status(200).json(data);
});

const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  res.status(200).json(data);
});

module.exports = {
  register,
  login,
  check,
  logout,
  resetPasswordRequest,
  resetPassword,
};
