import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import CustomError from '../utils/customError.js';

// Catch async helper to eliminate standard try-catch boilerplate in routes
export const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Read token from Authorization Header or Cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new CustomError('You are not logged in! Please log in to gain access.', 401));
  }

  if (!process.env.JWT_SECRET) {
    return next(new CustomError('JWT secret is not configured for authentication.', 500));
  }

  // 2) Validate token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Verify if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new CustomError('The user belonging to this session no longer exists.', 401));
  }

  // 4) Grant access
  req.user = currentUser;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is set by protect middleware
    if (!roles.includes(req.user.role)) {
      return next(new CustomError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
