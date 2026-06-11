const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

const router = Router();

router.post('/signup', validate({ body: registerSchema }), authController.register);
router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', validate({ body: loginSchema }), authController.login);
router.get('/check', requireAuth, authController.check);
router.get('/logout', authController.logout);
router.post(
  '/reset-password-request',
  validate({ body: resetPasswordRequestSchema }),
  authController.resetPasswordRequest
);
router.post('/reset-password', validate({ body: resetPasswordSchema }), authController.resetPassword);

module.exports = router;
