const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/product.service');

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json(product);
});

const getProducts = asyncHandler(async (req, res) => {
  const { items, total } = await productService.getProducts(req.query);
  res.set('X-Total-Count', String(total));
  res.status(200).json(items);
});

const getProductById = asyncHandler(async (req, res) => {
  const includeDeleted = String(req.query.admin || '').toLowerCase() === 'true';
  const product = await productService.getProductById(req.params.id, includeDeleted);
  res.status(200).json(product);
});

const getBrands = asyncHandler(async (req, res) => {
  const brands = await productService.getBrands();
  res.status(200).json(brands);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, { deleted: true });
  res.status(200).json(product);
});

module.exports = {
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  getBrands,
  deleteProduct,
};
