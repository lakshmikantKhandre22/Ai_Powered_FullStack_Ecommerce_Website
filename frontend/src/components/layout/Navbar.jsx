import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, Search, Heart, User, LogOut, ChevronDown, LayoutDashboard, ShoppingCart, UserCheck, Menu, X } from 'lucide-react';
import { logoutUser } from '../../redux/slices/authSlice.js';
import { fetchCategories, setFilter } from '../../redux/slices/productSlice.js';
import { fetchCartDB, fetchWishlistDB, clearCartOnLogout } from '../../redux/slices/cartSlice.js';
import CartDrawer from './CartDrawer.jsx';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { cartItems, wishlist } = useSelector((state) => state.cart);
  const { categories, activeFilters } = useSelector((state) => state.products);

  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load categories and initial state on mount
  useEffect(() => {
    dispatch(fetchCategories());
    if (isAuthenticated) {
      dispatch(fetchCartDB());
      dispatch(fetchWishlistDB());
    }
  }, [dispatch, isAuthenticated]);

  // Keep search input in sync with active Redux filters
  useEffect(() => {
    if (location.pathname !== '/catalog') {
      setSearchQuery('');
    } else {
      setSearchQuery(activeFilters.search || '');
    }
  }, [activeFilters.search, location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setFilter({ search: searchQuery }));
    navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`);
    setIsMobileMenuOpen(false);
  };

  const handleCategorySelect = (categorySlug) => {
    dispatch(setFilter({ category: categorySlug }));
    navigate(`/catalog?category=${categorySlug}`);
    setIsCategoryOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(clearCartOnLogout());
    setIsProfileOpen(false);
    navigate('/login');
  };

  // Close dropdowns on mouse clicks outside
  useEffect(() => {
    const closeDropdowns = () => {
      setIsProfileOpen(false);
      setIsCategoryOpen(false);
    };
    window.addEventListener('click', closeDropdowns);
    return () => window.removeEventListener('click', closeDropdowns);
  }, []);

  return (
    <>
      <header className="glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* 1) Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="bg-primary p-2.5 rounded-2xl group-hover:rotate-6 transition-all duration-300 shadow-md shadow-blue-500/10">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <span className="font-display font-black text-2xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ShopSphere
                </span>
              </Link>
            </div>

            {/* 2) Middle Navigation (Categories & Searching) */}
            <div className="hidden md:flex items-center space-x-6 flex-1 max-w-2xl mx-12">
              {/* Category dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 font-medium py-2 rounded-xl transition"
                >
                  <span>Departments</span>
                  <ChevronDown className={`h-4 w-4 transform transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryOpen && (
                  <div className="absolute left-0 mt-3 w-56 glass-card shadow-xl p-2 z-50 animate-fade-in">
                    <Link
                      to="/catalog"
                      onClick={() => { dispatch(setFilter({ category: '' })); setIsCategoryOpen(false); }}
                      className="block px-4 py-2.5 text-sm font-medium hover:bg-slate-50 hover:text-primary rounded-lg transition"
                    >
                      All Departments
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => handleCategorySelect(cat.slug)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 hover:text-primary rounded-lg transition font-normal"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 group">
                <input
                  type="text"
                  placeholder="Search elite electronics, cozy hoodies, organic serum..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-primary/50 pl-11 pr-4 py-2.5 rounded-xl outline-none text-sm placeholder:text-slate-400 group-hover:bg-slate-100/50 transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-blue-100/40"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 focus-within:text-primary transition" />
              </form>
            </div>

            {/* 3) Right Icons Links */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2.5 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 text-slate-600 hover:text-red-500 rounded-xl transition"
              >
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-black h-4 w-4 flex items-center justify-center rounded-full animate-bounce">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Shopping Cart Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 text-slate-600 hover:text-primary rounded-xl transition"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black h-4 w-4 flex items-center justify-center rounded-full">
                    {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
                )}
              </button>

              {/* Profile drop downs */}
              {isAuthenticated ? (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 pl-1.5 pr-3 py-1.5 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition cursor-pointer"
                  >
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=64'}
                      alt="avatar"
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                    />
                    <span className="text-xs font-semibold text-slate-600 truncate max-w-[80px]">
                      {user?.name.split(' ')[0]}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-slate-400 transform transition ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-64 glass-card shadow-xl p-3 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50 rounded-xl mb-2">
                        <img
                          src={user?.avatar}
                          alt="avatar"
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div className="truncate">
                          <h4 className="font-display font-semibold text-sm text-darkSlate-900 leading-none">{user?.name}</h4>
                          <span className="text-slate-400 text-xs truncate block mt-1">{user?.email}</span>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 hover:text-primary rounded-lg transition"
                      >
                        <User className="h-4 w-4" />
                        <span>My Account Profile</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 hover:text-primary rounded-lg transition"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Track My Shipments</span>
                      </Link>

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition font-medium"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <span>Admin Command Dashboard</span>
                        </Link>
                      )}

                      <div className="border-t border-slate-100 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-danger hover:bg-red-50 rounded-lg transition text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out Session</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="btn-outline !px-4 !py-2 text-sm text-slate-700">
                    Log In
                  </Link>
                  <Link to="/register" className="btn-primary !px-4 !py-2 text-sm text-white">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger menu */}
            <div className="flex md:hidden items-center space-x-2.5">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-600 hover:text-primary transition"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black h-3.5 w-3.5 flex items-center justify-center rounded-full">
                    {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 transition focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 animate-fade-in shadow-lg">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex group">
              <input
                type="text"
                placeholder="Search catalog products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 focus:border-primary/50 pl-10 pr-4 py-2 rounded-xl outline-none text-xs"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </form>

            {/* Category selection */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Departments</h4>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-lg text-slate-600 hover:text-primary transition"
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 my-3"></div>

            {/* Auth Controls */}
            {isAuthenticated ? (
              <div className="space-y-1.5">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-600 rounded-lg transition"
                >
                  <User className="h-4 w-4" />
                  <span>My Account Profile</span>
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-600 rounded-lg transition"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Track My Shipments</span>
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Admin Command Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-danger hover:bg-red-50 rounded-lg transition text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 px-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-outline text-center !py-2 text-xs"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-primary text-center !py-2 text-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Slideout Drawer overlay */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;
