const { Router } = require('express');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const supportRoutes = require('./support.routes');
const productController = require('../controllers/product.controller');

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.get('/brands', productController.getBrands);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/support', supportRoutes);

module.exports = router;
