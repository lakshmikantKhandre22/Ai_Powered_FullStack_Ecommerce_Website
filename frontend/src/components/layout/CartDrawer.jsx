import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';
import {
  updateCartQtyDB,
  updateGuestCartQty,
  removeFromCartDB,
  removeFromGuestCart
} from '../../redux/slices/cartSlice.js';

const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Calculate cart totals
  const subtotal = cartItems.reduce((acc, item) => {
    if (!item.productId) return acc;
    const price = item.productId.discountPrice > 0 ? item.productId.discountPrice : item.productId.price;
    return acc + price * item.quantity;
  }, 0);

  const handleQtyChange = (productId, currentQty, amount) => {
    const nextQty = currentQty + amount;
    if (nextQty < 1) return;

    if (isAuthenticated) {
      dispatch(updateCartQtyDB({ productId, quantity: nextQty }));
    } else {
      dispatch(updateGuestCartQty({ productId, quantity: nextQty }));
    }
  };

  const handleRemove = (productId) => {
    if (isAuthenticated) {
      dispatch(removeFromCartDB(productId));
    } else {
      dispatch(removeFromGuestCart(productId));
    }
  };

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black"
          />

          {/* Drawer Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-slate-100"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="font-display font-bold text-lg text-darkSlate-900">Your Shopping Cart</span>
                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  {cartItems.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="bg-slate-50 p-6 rounded-full text-slate-300">
                    <ShoppingCart className="h-12 w-12" />
                  </div>
                  <h3 className="font-display font-semibold text-slate-800 text-base">Your cart is empty</h3>
                  <p className="text-slate-400 text-sm max-w-[250px]">
                    Looks like you haven't seeded items in your checkout selection yet.
                  </p>
                  <button
                    onClick={() => { onClose(); navigate('/catalog'); }}
                    className="btn-primary text-xs !py-2"
                  >
                    Go Shop Products
                  </button>
                </div>
              ) : (
                cartItems.map((item) => {
                  const prod = item.productId;
                  if (!prod) return null;
                  const finalPrice = prod.discountPrice > 0 ? prod.discountPrice : prod.price;

                  return (
                    <motion.div
                      key={prod._id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-4 shadow-sm group hover:border-slate-200 transition-all"
                    >
                      {/* Product Thumbnail */}
                      <img
                        src={prod.images?.[0] || 'https://via.placeholder.com/150'}
                        alt={prod.title}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-100 group-hover:scale-105 transition-transform duration-200"
                      />

                      {/* Details */}
                      <div className="flex-1 ml-4 pr-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold font-display">
                          {prod.brand}
                        </span>
                        <h4 className="font-sans font-semibold text-sm text-darkSlate-900 line-clamp-1">
                          {prod.title}
                        </h4>
                        <div className="flex items-baseline space-x-1.5 mt-1">
                          <span className="font-semibold text-sm text-primary">
                            ₹{finalPrice.toFixed(2)}
                          </span>
                          {prod.discountPrice > 0 && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{prod.price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center space-x-3 mt-2">
                          <button
                            onClick={() => handleQtyChange(prod._id, item.quantity, -1)}
                            className="p-1 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 transition"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold text-slate-700">{item.quantity}</span>
                          <button
                            onClick={() => handleQtyChange(prod._id, item.quantity, 1)}
                            className="p-1 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 transition"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(prod._id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-danger rounded-xl transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Cart Subtotal</span>
                  <span className="font-display font-bold text-2xl text-darkSlate-900">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Shipping, discounts, and visual transaction parameters will be calculated securely upon checkout validation.
                </p>
                <button
                  onClick={handleCheckoutClick}
                  className="btn-primary w-full flex items-center justify-center space-x-2 py-3.5 group"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
