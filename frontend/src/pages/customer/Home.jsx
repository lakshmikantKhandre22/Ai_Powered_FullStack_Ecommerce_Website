import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Truck, BadgePercent, Headset } from 'lucide-react';
import { fetchProducts, setFilter, resetFilters } from '../../redux/slices/productSlice.js';
import ProductCard from '../../components/product/ProductCard.jsx';
import ProductSkeleton from '../../components/common/ProductSkeleton.jsx';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { products, categories, loading } = useSelector((state) => state.products);

  // Load latest items on page entry
  useEffect(() => {
    dispatch(resetFilters()); // Clear filters
    dispatch(fetchProducts({ limit: 4, sortBy: 'newest' })); // Load first 4 newest items
  }, [dispatch]);

  const handleShopNow = () => {
    dispatch(resetFilters());
    navigate('/catalog');
  };

  const handleCategoryClick = (categorySlug) => {
    dispatch(resetFilters());
    dispatch(setFilter({ category: categorySlug }));
    navigate(`/catalog?category=${categorySlug}`);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1) HERO CANVAS */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-darkSlate-900 via-slate-900 to-indigo-950 text-white min-h-[500px] flex items-center shadow-xl mx-4 sm:mx-6 lg:mx-8 mt-6">
        {/* Visual elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 opacity-35 md:opacity-85 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop"
            alt="Elite Shopping cover"
            className="w-full h-full object-cover mix-blend-overlay md:mix-blend-normal"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-darkSlate-900 via-darkSlate-900/60 to-transparent" />
        </div>

        {/* Hero Context */}
        <div className="max-w-2xl px-8 sm:px-12 md:px-16 py-20 relative z-10 space-y-6">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-primary/20 border border-primary/30 text-primary-light text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest inline-block font-display"
          >
            Elite Curation Selections
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-display font-black leading-tight tracking-tight text-white"
          >
            Elevate Your <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
              Lifestyle Standard
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg"
          >
            Browse elite gadgets, curated streetwear, rustic home furnishings, and natural skincare products in a single premium storefront.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-4"
          >
            <button
              onClick={handleShopNow}
              className="btn-primary flex items-center space-x-2 py-3.5 px-7 group shadow-blue-500/20"
            >
              <span>Explore Collection</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2) CORE VALUE PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center space-x-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <div className="bg-blue-50 p-3.5 rounded-xl text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-darkSlate-900">Expedited Deliveries</h4>
              <p className="text-xs text-slate-400 mt-0.5">Complimentary shipping on orders ₹1000+</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <div className="bg-green-50 p-3.5 rounded-xl text-success">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-darkSlate-900">Secure Payments</h4>
              <p className="text-xs text-slate-400 mt-0.5">Razorpay & SSL secured checks</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <div className="bg-amber-50 p-3.5 rounded-xl text-secondary">
              <BadgePercent className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-darkSlate-900">Seasonal Curation</h4>
              <p className="text-xs text-slate-400 mt-0.5">Discounts up to 40% on top picks</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <div className="bg-purple-50 p-3.5 rounded-xl text-purple-600">
              <Headset className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-darkSlate-900">Help Center</h4>
              <p className="text-xs text-slate-400 mt-0.5">Dedicated client assistance 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3) SHOP BY DEPARTMENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-darkSlate-900">Shop by Department</h2>
          <p className="text-slate-400 text-sm">
            Explore curated listings and products engineered to fit your specific daily selections.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat, index) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              onClick={() => handleCategoryClick(cat.slug)}
              className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 shadow-sm relative pt-[80%] bg-slate-50 transition"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-darkSlate-950/85 via-darkSlate-950/20 to-transparent flex items-end p-5" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                <span className="font-display font-bold text-sm sm:text-base text-white tracking-wide">
                  {cat.name}
                </span>
                <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-lg text-white group-hover:bg-primary transition duration-300">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4) FEATURED NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-darkSlate-900">Featured Additions</h2>
            <p className="text-slate-400 text-sm hidden sm:block">
              Discover the latest items that have arrived in our catalog this week.
            </p>
          </div>
          <button
            onClick={handleShopNow}
            className="flex items-center space-x-1 text-primary hover:text-primary-dark text-sm font-semibold transition"
          >
            <span>View All Products</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array(4)
              .fill(null)
              .map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
