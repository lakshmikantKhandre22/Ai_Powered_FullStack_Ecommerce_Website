import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import CustomError from '../utils/customError.js';
import { catchAsync } from '../middleware/authMiddleware.js';

// @desc    Create a new order & deduct stock
// @route   POST /api/orders
// @access  Private
export const createOrder = catchAsync(async (req, res, next) => {
  const { products, shippingAddress, paymentMethod, paymentStatus, totalAmount } = req.body;

  if (!products || products.length === 0) {
    return next(new CustomError('No products provided for order placement', 400));
  }

  // 1) Verify and deduct product stock
  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return next(new CustomError(`Product not found with ID ${item.productId}`, 404));
    }
    
    if (product.stock < item.quantity) {
      return next(new CustomError(`Insufficient stock for product: ${product.title}. Only ${product.stock} left.`, 400));
    }

    // Deduct stock
    product.stock -= item.quantity;
    await product.save();
  }

  // 2) Place the order
  const order = await Order.create({
    userId: req.user._id,
    products,
    shippingAddress,
    paymentMethod,
    paymentStatus: paymentStatus || 'Pending',
    totalAmount,
    orderStatus: 'Pending'
  });

  // 3) Empty the customer's shopping cart
  await Cart.findOneAndDelete({ userId: req.user._id });

  res.status(201).json({
    status: 'success',
    order
  });
});

// @desc    Get currently logged-in user orders list
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ userId: req.user._id })
    .populate('products.productId', 'title images price')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: orders.length,
    orders
  });
});

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('products.productId', 'title brand images price');

  if (!order) {
    return next(new CustomError('Order not found with that ID', 404));
  }

  // Allow access only to order author or admin
  if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new CustomError('You are not authorized to view this order details', 403));
  }

  res.status(200).json({
    status: 'success',
    order
  });
});

// @desc    Get all orders (Admin-only)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find()
    .populate('userId', 'name email')
    .populate('products.productId', 'title price')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: orders.length,
    orders
  });
});

// @desc    Update order shipping/fulfillment status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { orderStatus, paymentStatus } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new CustomError('Order not found with that ID', 404));
  }

  if (orderStatus) {
    order.orderStatus = orderStatus;
    if (orderStatus === 'Delivered') {
      order.deliveredAt = Date.now();
      order.paymentStatus = 'Paid'; // Auto-mark paid on delivery
    }
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }

  await order.save();

  res.status(200).json({
    status: 'success',
    order
  });
});
