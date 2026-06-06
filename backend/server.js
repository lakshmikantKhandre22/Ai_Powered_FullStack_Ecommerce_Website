import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
 // Use reliable public DNS servers to avoid resolution issues in certain environments

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Import configs & middlewares
import connectDB from './config/db.js';
import CustomError from './utils/customError.js';
import globalErrorHandler from './middleware/errorMiddleware.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Load environmental configurations
dotenv.config();

// Establish MongoDB connection
connectDB();

const app = express();

// 1) GLOBAL MIDDLEWARES
app.use(helmet()); // Secure HTTP headers

// Allow cross-origin requests from the client port
app.use(
  cors({
    origin: ['https://ai-powered-fullstack-ecommerce-website-89fw.onrender.com'], // standard Vite ports
    credentials: true, // Allow cookies to be sent along with cross-origin requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);


if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev')); // Dev logs console printing
}


app.use(express.json()); // Body parser
app.use(cookieParser()); // Cookie parser

// 2) MOUNT BUSINESS ROUTERS
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// 3) UNHANDLED ROUTES FALLBACK
app.all('*', (req, res, next) => {
  next(new CustomError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4) CENTRALIZED ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

// Start listening for incoming network requests (force nodemon reload)
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[ShopSphere] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections outside Express
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
