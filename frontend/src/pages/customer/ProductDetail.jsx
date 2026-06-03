import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Heart, ShoppingBag, Plus, Minus, Send, ShieldCheck, HelpCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProductById, fetchProductReviews, addProductReview, clearProductDetails } from '../../redux/slices/productSlice.js';
import { addToCartDB, addToGuestCart, addToWishlistDB, removeFromWishlistDB } from '../../redux/slices/cartSlice.js';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { currentProduct, reviews, detailLoading, reviewsLoading } = useSelector((state) => state.products);
  const { wishlist } = useSelector((state) => state.cart);

  const [activeImage, setActiveImage] = useState('');
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  // Review form state
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const isWishlisted = wishlist.some((item) => item.productId?._id === currentProduct?._id);

  // 1) Fetch product details on mount
  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchProductReviews(id));
    
    return () => {
      dispatch(clearProductDetails());
    };
  }, [dispatch, id]);

  // 2) Sync active image once details load
  useEffect(() => {
    if (currentProduct && currentProduct.images?.length > 0) {
      setActiveImage(currentProduct.images[0]);
    }
  }, [currentProduct]);

  if (detailLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 animate-pulse space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Shimmer Gallery */}
          <div className="space-y-4">
            <div className="pt-[100%] bg-slate-200 rounded-3xl" />
            <div className="flex space-x-3">
              <div className="h-20 w-20 bg-slate-200 rounded-xl" />
              <div className="h-20 w-20 bg-slate-200 rounded-xl" />
            </div>
          </div>
          {/* Shimmer Details */}
          <div className="space-y-6">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-10 w-3/4 bg-slate-200 rounded" />
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="h-32 w-full bg-slate-200 rounded" />
            <div className="h-12 w-48 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-6 space-y-4">
        <h2 className="text-xl font-display font-bold text-slate-800">Product Not Found</h2>
        <p className="text-slate-400 text-sm">We couldn't retrieve details for this item ID. It may have been deleted.</p>
        <button onClick={() => navigate('/catalog')} className="btn-primary">Return to Shop Catalog</button>
      </div>
    );
  }

  const finalPrice = currentProduct.discountPrice > 0 ? currentProduct.discountPrice : currentProduct.price;

  const handleQtyAdjust = (amount) => {
    const nextQty = purchaseQty + amount;
    if (nextQty >= 1 && nextQty <= currentProduct.stock) {
      setPurchaseQty(nextQty);
    }
  };

  const handleAddToCart = () => {
    if (currentProduct.stock < 1) {
      toast.error('This product is out of stock!');
      return;
    }

    if (isAuthenticated) {
      dispatch(addToCartDB({ productId: currentProduct._id, quantity: purchaseQty }));
    } else {
      dispatch(addToGuestCart({ product: currentProduct, quantity: purchaseQty }));
    }
    toast.success(`Added ${purchaseQty} item(s) to your cart! 🛒`);
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage your wishlist!');
      return;
    }

    if (isWishlisted) {
      dispatch(removeFromWishlistDB(currentProduct._id));
      toast.success('Removed from wishlist');
    } else {
      dispatch(addToWishlistDB(currentProduct._id));
      toast.success('Added to wishlist ❤️');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to leave a product review!');
      return;
    }

    if (!formComment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await dispatch(
        addProductReview({
          productId: currentProduct._id,
          rating: formRating,
          comment: formComment
        })
      ).unwrap();
      
      toast.success('Review submitted successfully!');
      setFormComment('');
      setFormRating(5);
    } catch (err) {
      toast.error(err || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Calculate percentage of review counts for aggregate bars
  const totalReviews = reviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    return {
      stars,
      count,
      pct: totalReviews > 0 ? (count / totalReviews) * 100 : 0
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-16">
      {/* 1) TOP HALF: DISPLAY & SELECTION SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Half: Image Gallery Viewport */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden pt-[100%] relative group">
            <img
              src={activeImage || 'https://via.placeholder.com/600'}
              alt={currentProduct.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
            />
          </div>
          
          {/* Thumbnails grid */}
          {currentProduct.images?.length > 1 && (
            <div className="flex space-x-3.5">
              {currentProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-slate-50 transition ${
                    activeImage === img ? 'border-primary' : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Half: Details context */}
        <div className="flex flex-col justify-between py-2 space-y-6">
          <div className="space-y-4">
            {/* Brand and Stock Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest font-display">
                {currentProduct.brand}
              </span>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                currentProduct.stock > 0
                  ? 'bg-green-50 text-success border border-green-100'
                  : 'bg-red-50 text-danger border border-red-100'
              }`}>
                {currentProduct.stock > 0 ? `In Stock (${currentProduct.stock})` : 'Out of Stock'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-display font-black text-darkSlate-900 leading-tight">
              {currentProduct.title}
            </h1>

            {/* Ratings Header */}
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <div className="flex items-center text-amber-400">
                <Star className="h-4.5 w-4.5 fill-current" />
              </div>
              <span className="text-sm font-semibold text-darkSlate-800">
                {currentProduct.ratings.toFixed(1)}
              </span>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => {
                  setActiveTab('reviews');
                  document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                {reviews.length} Client Review(s)
              </button>
            </div>

            {/* Pricing Section */}
            <div className="flex items-baseline space-x-3">
              <span className="font-display font-bold text-3xl text-primary">
                ₹{finalPrice.toFixed(2)}
              </span>
              {currentProduct.discountPrice > 0 && (
                <span className="text-lg text-slate-400 line-through">
                  ₹{currentProduct.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Quick description summary */}
            <p className="text-slate-400 text-sm leading-relaxed">
              {currentProduct.description.substring(0, 200)}...
            </p>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-100">
            {/* Quantity Adjuster */}
            {currentProduct.stock > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Quantity</span>
                <div className="flex items-center space-x-4 border border-slate-200 rounded-xl px-3 py-1.5 bg-white">
                  <button
                    onClick={() => handleQtyAdjust(-1)}
                    disabled={purchaseQty <= 1}
                    className="p-1 hover:bg-slate-100 text-slate-500 rounded transition disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-sm w-4 text-center">{purchaseQty}</span>
                  <button
                    onClick={() => handleQtyAdjust(1)}
                    disabled={purchaseQty >= currentProduct.stock}
                    className="p-1 hover:bg-slate-100 text-slate-500 rounded transition disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddToCart}
                disabled={currentProduct.stock < 1}
                className="btn-primary flex-1 flex items-center justify-center space-x-2 py-4 shadow-blue-500/10"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Add items to Cart</span>
              </button>

              <button
                onClick={handleWishlistToggle}
                className={`p-4 border rounded-xl transition active:scale-95 ${
                  isWishlisted
                    ? 'bg-red-50 border-red-100 text-red-500'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:bg-slate-50'
                }`}
                title="Toggle Wishlist Favorites"
              >
                <Heart className="h-5 w-5 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2) BOTTOM HALF: DESCRIPTION & REVIEWS PANEL */}
      <section id="product-tabs" className="glass-card shadow-sm p-8 space-y-8">
        {/* Tabs Bar */}
        <div className="flex space-x-6 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab('description')}
            className={`font-display font-bold text-sm uppercase tracking-wider pb-3 -mb-3.5 transition border-b-2 ${
              activeTab === 'description' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Full Description
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`font-display font-bold text-sm uppercase tracking-wider pb-3 -mb-3.5 transition border-b-2 ${
              activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Context Container */}
        <div className="pt-2">
          {activeTab === 'description' && (
            <div className="space-y-4 text-slate-500 text-sm leading-relaxed max-w-4xl">
              <p>{currentProduct.description}</p>
              <div className="grid grid-cols-2 gap-4 max-w-md pt-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span>Brand: {currentProduct.brand}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span>Resilience Grade: Certified</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Aggregates Rating Bar Column */}
              <div className="space-y-6">
                <h4 className="font-display font-bold text-base text-darkSlate-900 uppercase tracking-wide">Overall Rating</h4>
                
                <div className="flex items-center space-x-4">
                  <span className="font-display font-black text-5xl text-darkSlate-950">
                    {currentProduct.ratings.toFixed(1)}
                  </span>
                  <div className="space-y-1">
                    <div className="flex text-amber-400">
                      <Star className="h-4.5 w-4.5 fill-current" />
                    </div>
                    <span className="text-xs text-slate-400 font-semibold uppercase">{reviews.length} Ratings</span>
                  </div>
                </div>

                {/* Rating Distribution Bars */}
                <div className="space-y-2">
                  {ratingDistribution.map((row) => (
                    <div key={row.stars} className="flex items-center space-x-3 text-xs text-slate-500 font-semibold">
                      <span className="w-3">{row.stars}</span>
                      <Star className="h-3 w-3 text-amber-400 fill-current" />
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                        <div
                          style={{ width: `${row.pct}%` }}
                          className="h-full bg-primary rounded-full transition-all duration-500"
                        />
                      </div>
                      <span className="w-6 text-right">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews listing & Writing Review Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* 1. Review Form */}
                {isAuthenticated ? (
                  <form onSubmit={handleReviewSubmit} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 space-y-4">
                    <h4 className="font-display font-bold text-sm text-darkSlate-900 uppercase tracking-wide">Write a Review</h4>
                    
                    {/* Star Rating adjusters */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 font-semibold mr-1">Your Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          className="text-amber-400 focus:outline-none transition hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <Star className={`h-5 w-5 ${star <= formRating ? 'fill-current' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>

                    {/* Review text field */}
                    <div className="relative">
                      <textarea
                        rows="3"
                        placeholder="Write a supportive review. Mention specifications, durability, styles..."
                        value={formComment}
                        onChange={(e) => setFormComment(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-primary/80 px-4 py-3 rounded-xl text-xs outline-none focus:ring-4 focus:ring-blue-100/50 resize-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="btn-primary text-xs flex items-center space-x-2 py-3 px-6 shadow-sm"
                    >
                      <Send className="h-3 w-3" />
                      <span>{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-xs text-slate-500">
                    <span>Please </span>
                    <Link to="/login" className="text-primary font-bold hover:underline">Log In</Link>
                    <span> to leave a product review and participate in aggregates.</span>
                  </div>
                )}

                {/* 2. Reviews List */}
                <div className="space-y-4">
                  <h4 className="font-display font-bold text-sm text-darkSlate-900 uppercase tracking-wide">Customer Feedback</h4>
                  {reviewsLoading ? (
                    <div className="text-center py-6 text-slate-400 text-xs">Loading reviews...</div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs">
                      No reviews submitted yet. Be the first to purchase and submit feedback!
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                      {reviews.map((r) => (
                        <div key={r._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            {/* Author */}
                            <div className="flex items-center space-x-3">
                              <img
                                src={r.userId?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=64'}
                                alt="avatar"
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                              <div>
                                <h5 className="font-semibold text-xs text-darkSlate-900 leading-none">{r.userId?.name || 'Customer'}</h5>
                                <span className="text-[10px] text-slate-400 block mt-1">
                                  {new Date(r.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Stars rating */}
                            <div className="flex text-amber-400 space-x-0.5">
                              {Array(r.rating)
                                .fill(null)
                                .map((_, idx) => (
                                  <Star key={idx} className="h-3 w-3 fill-current" />
                                ))}
                            </div>
                          </div>
                          
                          {/* Comments */}
                          <p className="text-xs text-slate-500 leading-relaxed pl-1">
                            {r.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
