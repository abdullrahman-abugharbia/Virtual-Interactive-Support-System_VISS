const ApiError = require('../utils/ApiError');
const categoryModel = require('../models/category.model');

async function listCategories() {
  return categoryModel.listCategories();
}

async function getCategoryById(id) {
  const category = await categoryModel.findCategoryById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
}

async function createCategory(payload) {
  return categoryModel.createCategory(payload);
}

async function updateCategory(id, payload) {
  const existing = await categoryModel.findCategoryById(id);
  if (!existing) {
    throw new ApiError(404, 'Category not found');
  }

  return categoryModel.updateCategory(id, payload);
}

async function deleteCategory(id) {
  const deleted = await categoryModel.deleteCategory(id);
  if (!deleted) {
    throw new ApiError(404, 'Category not found');
  }

  return true;
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
