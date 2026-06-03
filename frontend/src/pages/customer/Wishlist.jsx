import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ChevronRight, ShoppingBag } from 'lucide-react';
import { fetchWishlistDB } from '../../redux/slices/cartSlice.js';
import ProductCard from '../../components/product/ProductCard.jsx';
import ProductSkeleton from '../../components/common/ProductSkeleton.jsx';

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { wishlist, wishlistLoading } = useSelector((state) => state.cart);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      dispatch(fetchWishlistDB());
    }
  }, [dispatch, isAuthenticated, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight text-darkSlate-900">Your Wishlist</h1>
        <p className="text-slate-400 text-sm mt-1">Curation of items favorited in your browser catalog</p>
      </div>

      {wishlistLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {Array(4)
            .fill(null)
            .map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
        </div>
      ) : wishlist.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <div className="bg-red-50 p-6 rounded-full text-red-400">
            <Heart className="h-10 w-10 fill-current animate-pulse" />
          </div>
          <h3 className="font-display font-bold text-slate-800 text-lg">Your Wishlist is Empty</h3>
          <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
            Curate your shopping favorites. Add hoodies, headphones, and stoneware to your wishlist and checkout anytime!
          </p>
          <Link to="/catalog" className="btn-primary text-xs flex items-center space-x-2">
            <span>Explore Collection</span>
          </Link>
        </div>
      ) : (
        /* Wishlisted Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => {
            const product = item.productId;
            if (!product) return null;
            return (
              <div key={item._id} className="h-full">
                <ProductCard product={product} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
