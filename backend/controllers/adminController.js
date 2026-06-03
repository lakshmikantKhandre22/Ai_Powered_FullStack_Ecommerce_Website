import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import CustomError from '../utils/customError.js';
import { catchAsync } from '../middleware/authMiddleware.js';

// @desc    Get dashboard metrics & visual analytics chart data
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = catchAsync(async (req, res, next) => {
  // 1) Fetch core metrics
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalUsers = await User.countDocuments({ role: 'customer' });

  // 2) Aggregate total revenue (Only from Paid orders)
  const revenueStats = await Order.aggregate([
    { $match: { paymentStatus: 'Paid' } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
  ]);
  const totalRevenue = revenueStats.length > 0 ? Math.round(revenueStats[0].totalRevenue * 100) / 100 : 0;

  // 3) Aggregate monthly sales data (for Recharts Area Chart)
  // Let's group orders by month of the current year
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const monthlyStats = await Order.aggregate([
    { 
      $match: { 
        paymentStatus: 'Paid',
        createdAt: { $gte: startOfYear }
      } 
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        sales: { $sum: '$totalAmount' },
        ordersCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Convert month number to month name
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlySales = monthNames.map((name, index) => {
    const matchedMonth = monthlyStats.find(stat => stat._id === index + 1);
    return {
      month: name,
      sales: matchedMonth ? Math.round(matchedMonth.sales * 100) / 100 : 0,
      orders: matchedMonth ? matchedMonth.ordersCount : 0
    };
  });

  // 4) Category sales breakdown (for Pie/Bar Charts)
  // Retrieve category orders by matching ordered products back to their categories
  const categorySalesStats = await Order.aggregate([
    { $match: { paymentStatus: 'Paid' } },
    { $unwind: '$products' },
    {
      $lookup: {
        from: 'products',
        localField: 'products.productId',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },
    {
      $group: {
        _id: '$productDetails.categoryId',
        revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
        quantity: { $sum: '$products.quantity' }
      }
    }
  ]);

  // Populate category names for charts
  const categorySales = [];
  for (const stat of categorySalesStats) {
    const category = await Category.findById(stat._id);
    categorySales.push({
      category: category ? category.name : 'Unknown',
      revenue: Math.round(stat.revenue * 100) / 100,
      quantity: stat.quantity
    });
  }

  // 5) Fetch recent 5 orders
  const recentOrders = await Order.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json({
    status: 'success',
    stats: {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts
    },
    monthlySales,
    categorySales,
    recentOrders
  });
});

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: users.length,
    users
  });
});

// @desc    Update user account privileges/roles
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;

  if (!role || !['customer', 'admin'].includes(role)) {
    return next(new CustomError('Please provide a valid role privilege.', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new CustomError('User not found with that ID', 404));
  }

  // Prevent admin from editing their own role self-destructively
  if (user._id.toString() === req.user._id.toString()) {
    return next(new CustomError('You cannot alter your own admin privileges.', 400));
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: `User role successfully elevated to ${role}`,
    user
  });
});

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError('User not found with that ID', 404));
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    return next(new CustomError('You cannot delete your own admin account.', 400));
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'User account successfully deleted'
  });
});
