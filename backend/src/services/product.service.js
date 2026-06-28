const ApiError = require('../utils/ApiError');
const productModel = require('../models/product.model');
const { parsePagination } = require('../utils/pagination');

function parseCsvQueryValue(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseSort(sortRaw) {
  const sortMap = {
    discountPrice: 'discountPrice',
    discount_price: 'discountPrice',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    price: 'price',
    rating: 'rating',
    stock: 'stock',
    id: 'id',
    title: 'title',
  };

  return sortMap[sortRaw] || 'id';
}

async function createProduct(payload) {
  return productModel.createProduct(payload);
}

async function updateProduct(id, payload) {
  const existing = await productModel.findProductById(id, { includeDeleted: true });
  if (!existing) {
    throw new ApiError(404, 'Product not found');
  }

  return productModel.updateProduct(id, payload);
}

async function getProductById(id, includeDeleted = false) {
  const product = await productModel.findProductById(id, { includeDeleted });
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
}

async function getProducts(query) {
  const categories = parseCsvQueryValue(query.category);
  const brands = parseCsvQueryValue(query.brand);
  const includeDeleted = String(query.admin || '').toLowerCase() === 'true';
  const { limit, offset } = parsePagination(query);

  const sort = parseSort(query._sort);
  const order = String(query._order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const search = String(query.q || query.search || '').trim();

  const toPrice = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const minPrice = toPrice(query.minPrice);
  const maxPrice = toPrice(query.maxPrice);

  return productModel.listProducts({
    categories,
    brands,
    includeDeleted,
    sort,
    order,
    limit,
    offset,
    search,
    minPrice,
    maxPrice,
  });
}

async function getBrands() {
  return productModel.listBrands();
}

module.exports = {
  createProduct,
  updateProduct,
  getProductById,
  getProducts,
  getBrands,
};
