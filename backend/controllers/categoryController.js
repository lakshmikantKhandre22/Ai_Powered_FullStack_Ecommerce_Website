import Category from '../models/Category.js';
import CustomError from '../utils/customError.js';
import { catchAsync } from '../middleware/authMiddleware.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find().sort({ name: 1 });

  res.status(200).json({
    status: 'success',
    results: categories.length,
    categories
  });
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = catchAsync(async (req, res, next) => {
  const { name, image } = req.body;

  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return next(new CustomError('A category with this name already exists.', 400));
  }

  const category = await Category.create({ name, image });

  res.status(201).json({
    status: 'success',
    category
  });
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = catchAsync(async (req, res, next) => {
  const { name, image } = req.body;
  
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new CustomError('Category not found', 404));
  }

  if (name) category.name = name;
  if (image) category.image = image;

  await category.save();

  res.status(200).json({
    status: 'success',
    category
  });
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    return next(new CustomError('Category not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Category successfully deleted'
  });
});
