import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';

// Layouts
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import ChatbotWidget from './components/common/ChatbotWidget.jsx';

// Pages
import Home from './pages/customer/Home.jsx';
import Catalog from './pages/customer/Catalog.jsx';
import ProductDetail from './pages/customer/ProductDetail.jsx';
import Wishlist from './pages/customer/Wishlist.jsx';
import Checkout from './pages/customer/Checkout.jsx';
import Orders from './pages/customer/Orders.jsx';
import Profile from './pages/customer/Profile.jsx';
import Login from './pages/customer/Login.jsx';
import Register from './pages/customer/Register.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageProducts from './pages/admin/ManageProducts.jsx';
import ManageCategories from './pages/admin/ManageCategories.jsx';
import ManageOrders from './pages/admin/ManageOrders.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';

// Route Guards
import ProtectedRoute from './utils/ProtectedRoute.jsx';
import { loadMe } from './redux/slices/authSlice.js';

const App = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Try to load user credentials from active cookies on startup
  useEffect(() => {
    dispatch(loadMe());
  }, [dispatch]);

  // Check if current route is an administrative panel to suppress standard layouts
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Dynamic Header */}
      {!isAdminRoute && <Navbar />}

      {/* Main Content Workspace */}
      <main className="flex-grow">
        <Routes>
          {/* Public Storefront */}
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Customer Routes */}
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Command Panel */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute adminOnly>
                <ManageProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute adminOnly>
                <ManageCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute adminOnly>
                <ManageOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback Catch-all -> redirects to Home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {/* Dynamic Footer */}
      {!isAdminRoute && <Footer />}

      {/* AI Assistant Floating Concierge */}
      {!isAdminRoute && <ChatbotWidget />}

      {/* Global Toast Alert Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'font-sans text-xs font-semibold text-slate-800 rounded-xl shadow-md border border-slate-100',
          duration: 3000,
          style: {
            background: '#ffffff',
          }
        }}
      />
    </div>
  );
};

export default App;
