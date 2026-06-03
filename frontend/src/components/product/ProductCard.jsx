import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addToCartDB,
  addToGuestCart,
  addToWishlistDB,
  removeFromWishlistDB
} from '../../redux/slices/cartSlice.js';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.cart);

  const isWishlisted = wishlist.some((item) => item.productId?._id === product._id);

  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigating to detail page on card click
    
    if (product.stock < 1) {
      toast.error('This item is currently out of stock!');
      return;
    }

    if (isAuthenticated) {
      dispatch(addToCartDB({ productId: product._id, quantity: 1 }));
    } else {
      dispatch(addToGuestCart({ product, quantity: 1 }));
    }
    
    toast.success(`${product.title} added to your cart! 🛒`);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to manage your wishlist!');
      return;
    }

    if (isWishlisted) {
      dispatch(removeFromWishlistDB(product._id));
      toast.success('Removed from wishlist');
    } else {
      dispatch(addToWishlistDB(product._id));
      toast.success('Added to wishlist ❤️');
    }
  };

  return (
    <div className="group bg-white border border-slate-100 hover:border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col relative h-full">
      {/* 1) Wishlist Overlay Heart */}
      <button
        onClick={handleWishlistToggle}
        className={`absolute top-4 right-4 z-10 p-2 rounded-xl transition-all duration-200 shadow-sm border ${
          isWishlisted
            ? 'bg-red-50 border-red-100 text-red-500 scale-105'
            : 'bg-white/80 backdrop-blur-md border-slate-100 text-slate-400 hover:text-red-500 hover:bg-white'
        }`}
      >
        <Heart className="h-4.5 w-4.5 fill-current" />
      </button>

      {/* 2) Product Image Link */}
      <Link to={`/product/${product._id}`} className="block relative overflow-hidden bg-slate-50 pt-[100%]">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300'}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.discountPrice > 0 && (
          <span className="absolute bottom-4 left-4 bg-danger text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm animate-pulse">
            Sale -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
          </span>
        )}
        {product.stock < 1 && (
          <span className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center text-white font-display font-bold text-xs uppercase tracking-widest">
            Out of Stock
          </span>
        )}
      </Link>

      {/* 3) Body description */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand */}
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-display block mb-1">
            {product.brand}
          </span>
          
          {/* Title */}
          <Link
            to={`/product/${product._id}`}
            className="font-sans font-semibold text-sm text-darkSlate-900 line-clamp-2 hover:text-primary transition-colors block leading-tight mb-2"
          >
            {product.title}
          </Link>

          {/* Ratings summary */}
          <div className="flex items-center space-x-1.5 mb-3">
            <div className="flex text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
            </div>
            <span className="text-xs font-semibold text-darkSlate-800">{product.ratings.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400">({product.reviewsCount})</span>
          </div>
        </div>

        {/* 4) Bottom Row: Price & Cart Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-2">
          <div className="flex flex-col">
            <span className="font-display font-bold text-base text-darkSlate-900 leading-none">
              ₹{finalPrice.toFixed(2)}
            </span>
            {product.discountPrice > 0 && (
              <span className="text-xs text-slate-400 line-through mt-1">
                ₹{product.price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock < 1}
            className="p-3 bg-slate-50 hover:bg-primary border border-slate-100 hover:border-primary text-slate-600 hover:text-white rounded-xl active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-300 disabled:border-slate-100"
            title="Add item to Cart"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
