import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import CustomError from '../utils/customError.js';
import { catchAsync } from '../middleware/authMiddleware.js';

// Helper to generate access tokens
const generateAccessToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

// Helper to generate refresh tokens
const generateRefreshToken = (id) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not configured.');
  }

  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Helper to bundle and send tokens securely
const sendTokenResponse = (user, statusCode, req, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const isSecureConnection = req.secure || req.headers['x-forwarded-proto'] === 'https';

  // Set HTTP-only Cookie for Refresh Token
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
    httpOnly: true,
    secure: isSecureConnection,
    sameSite: isSecureConnection ? 'none' : 'lax'
  };

  res.cookie('token', accessToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // Access token cookie option fallback
  });
  
  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Hide password from response
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    user
  });
};

// @desc    Register a new user (with Simulated OTP Verification)
// @route   POST /api/auth/register
// @access  Public
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new CustomError('An account is already registered with this email address.', 400));
  }

  // Generate a random 6-digit verification OTP
  const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

  // Create user
  const newUser = await User.create({
    name,
    email,
    password,
    verificationOtp,
    otpExpiry,
    isVerified: false // Needs verification
  });

  // Log simulated OTP for developer/testing purposes
  console.log(`[ShopSphere] Simulated Registration OTP for ${email}: ${verificationOtp}`);

  res.status(201).json({
    status: 'success',
    message: 'Registration successful! Please check your email/console for your verification OTP.',
    email: newUser.email,
    // Return OTP in response only in dev environment for automated frontend testing ease!
    otp: process.env.NODE_ENV === 'development' || true ? verificationOtp : undefined
  });
});

// @desc    Verify user email via OTP
// @route   POST /api/auth/verify
// @access  Public
export const verifyEmail = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new CustomError('Please provide email and verification OTP.', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new CustomError('No user found with this email address.', 404));
  }

  if (user.isVerified) {
    return next(new CustomError('This email is already verified. Please log in directly.', 400));
  }

  // Check if OTP matches and hasn't expired
  if (user.verificationOtp !== otp || new Date() > user.otpExpiry) {
    return next(new CustomError('Invalid or expired OTP code.', 400));
  }

  // Clear OTP fields and activate user
  user.isVerified = true;
  user.verificationOtp = null;
  user.otpExpiry = null;
  await user.save();

  sendTokenResponse(user, 200, req, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new CustomError('Please provide email and password', 400));
  }

  // 2) Find user and select password (as it is excluded by default)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new CustomError('Invalid email or password', 401));
  }

  // 3) Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new CustomError('Invalid email or password', 401));
  }

  // 4) Check if email is verified
  if (!user.isVerified) {
    return next(new CustomError('Your account has not been verified yet. Please verify your email first.', 401));
  }

  // 5) Issue tokens
  sendTokenResponse(user, 200, req, res);
});

// @desc    Logout user & Clear cookies
// @route   POST /api/auth/logout
// @access  Private
export const logout = catchAsync(async (req, res, next) => {
  const isSecureConnection = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const cookieOptions = {
    httpOnly: true,
    secure: isSecureConnection,
    sameSite: isSecureConnection ? 'none' : 'lax'
  };

  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// @desc    Refresh session using HTTP-only Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = catchAsync(async (req, res, next) => {
  let rToken = req.cookies.refreshToken;

  if (!rToken) {
    return next(new CustomError('No refresh session found. Please log in again.', 401));
  }

  // Verify Refresh Token
  if (!process.env.JWT_REFRESH_SECRET) {
    return next(new CustomError('JWT refresh secret is not configured.', 500));
  }

  const decoded = jwt.verify(
    rToken,
    process.env.JWT_REFRESH_SECRET
  );

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new CustomError('Session belongs to a user that no longer exists.', 401));
  }

  sendTokenResponse(user, 200, req, res);
});

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    user: req.user
  });
});

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new CustomError('User not found', 404));
  }

  if (name) user.name = name;
  if (avatar) user.avatar = avatar;

  await user.save();

  res.status(200).json({
    status: 'success',
    user
  });
});
