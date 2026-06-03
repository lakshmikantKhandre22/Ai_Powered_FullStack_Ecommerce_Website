import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, RotateCcw, ChevronLeft, ChevronRight, SlidersHorizontal, Grid, AlertTriangle, Sparkles } from 'lucide-react';
import { fetchProducts, fetchCategories, setFilter, setPage, resetFilters } from '../../redux/slices/productSlice.js';
import ProductCard from '../../components/product/ProductCard.jsx';
import ProductSkeleton from '../../components/common/ProductSkeleton.jsx';

const Catalog = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const { products, brands, categories, totalProducts, page, pages, limit, loading, activeFilters } = useSelector(
    (state) => state.products
  );

  const [localSearch, setLocalSearch] = useState(activeFilters.search || '');
  const [localMinPrice, setLocalMinPrice] = useState(activeFilters.minPrice || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(activeFilters.maxPrice || '');

  // 1) Sync URL query parameters to Redux filter state on mount
  useEffect(() => {
    dispatch(fetchCategories());

    const urlCategory = searchParams.get('category') || '';
    const urlSearch = searchParams.get('search') || '';
    
    dispatch(
      setFilter({
        category: urlCategory,
        search: urlSearch,
        page: 1
      })
    );
  }, [dispatch, searchParams]);

  // 2) Trigger API fetches when Redux active filters update
  useEffect(() => {
    dispatch(fetchProducts(activeFilters));
    setLocalSearch(activeFilters.search || '');
    setLocalMinPrice(activeFilters.minPrice || '');
    setLocalMaxPrice(activeFilters.maxPrice || '');
  }, [dispatch, activeFilters]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setFilter({ search: localSearch }));
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    dispatch(setFilter({ minPrice: localMinPrice, maxPrice: localMaxPrice }));
  };

  const handleBrandChange = (brandName) => {
    // If brand is already selected, remove it, else append it
    let selectedBrands = activeFilters.brand ? activeFilters.brand.split(',') : [];
    if (selectedBrands.includes(brandName)) {
      selectedBrands = selectedBrands.filter((b) => b !== brandName);
    } else {
      selectedBrands.push(brandName);
    }
    dispatch(setFilter({ brand: selectedBrands.join(',') }));
  };

  const handleRatingChange = (rating) => {
    dispatch(setFilter({ minRating: rating }));
  };

  const handleSortChange = (e) => {
    dispatch(setFilter({ sortBy: e.target.value }));
  };

  const handleCategorySelect = (categorySlug) => {
    dispatch(setFilter({ category: categorySlug }));
  };

  const handleClearAll = () => {
    dispatch(resetFilters());
    setLocalSearch('');
    setLocalMinPrice('');
    setLocalMaxPrice('');
  };

  const handlePrevPage = () => {
    if (page > 1) {
      dispatch(setPage(page - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (page < pages) {
      dispatch(setPage(page + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-darkSlate-900">Explore Catalog</h1>
          <p className="text-slate-400 text-sm mt-1">
            Displaying <span className="font-semibold text-primary">{totalProducts}</span> premium matches
          </p>
        </div>

        {/* Sort Select */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sort By</span>
          <select
            value={activeFilters.sortBy}
            onChange={handleSortChange}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-primary transition"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating-desc">Customer Rating</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ================= LEFT COLUMN: FILTERS PANEL ================= */}
        <div className="space-y-6 lg:sticky lg:top-24 h-fit">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-darkSlate-800">
                <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
                <span className="font-display font-bold text-sm uppercase tracking-wide">Filters</span>
              </div>
              <button
                onClick={handleClearAll}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-primary transition"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Keyword Search */}
            <form onSubmit={handleSearchSubmit} className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Keywords</label>
              <div className="relative flex">
                <input
                  type="text"
                  placeholder="Filter keywords..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-primary/50 pl-10 pr-3 py-2.5 rounded-xl outline-none text-xs"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </form>

            {/* Categories Rail */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Departments</label>
              <div className="space-y-1 flex flex-col">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                    activeFilters.category === ''
                      ? 'bg-blue-50/50 text-primary font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Departments
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                      activeFilters.category === cat.slug
                        ? 'bg-blue-50/50 text-primary font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Price Range (₹)</label>
              <form onSubmit={handlePriceApply} className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-primary/50 px-3 py-2 rounded-xl outline-none text-xs text-center"
                />
                <span className="text-slate-300">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-primary/50 px-3 py-2 rounded-xl outline-none text-xs text-center"
                />
                <button type="submit" className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-xl transition">
                  Go
                </button>
              </form>
            </div>

            {/* Brand Checkboxes */}
            {brands.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Brands</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {brands.map((b) => {
                    const isChecked = activeFilters.brand ? activeFilters.brand.split(',').includes(b) : false;
                    return (
                      <label key={b} className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-600 hover:text-slate-900 transition">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBrandChange(b)}
                          className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="font-medium">{b}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Star Rating Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Customer Reviews</label>
              <div className="space-y-2">
                {[4, 3, 2].map((num) => (
                  <label key={num} className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-600 hover:text-slate-900 transition">
                    <input
                      type="radio"
                      name="rating"
                      checked={Number(activeFilters.minRating) === num}
                      onChange={() => handleRatingChange(num)}
                      className="border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="font-semibold">{num}⭐ & up</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: PRODUCT GRID ================= */}
        <div className="lg:col-span-3 space-y-6">
          {activeFilters.search && (activeFilters.search.split(/\s+/).length > 2 || activeFilters.search.toLowerCase().includes('i want') || activeFilters.search.toLowerCase().includes('show me') || activeFilters.search.toLowerCase().includes('looking for') || activeFilters.search.toLowerCase().includes('need a')) && (
            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100 rounded-3xl p-5 flex items-start gap-4 shadow-sm mb-6">
              <div className="bg-blue-600 text-white p-2.5 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/10">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs uppercase text-blue-600 tracking-wider leading-none">Smart AI Search Active</h4>
                <p className="text-slate-600 text-xs font-bold mt-1.5 leading-relaxed">
                  "<strong>{activeFilters.search}</strong>"
                </p>
                <p className="text-slate-400 text-[10px] mt-2 leading-relaxed">
                  ShopSphere's Smart Search successfully converted your conversational query into category and feature filters across our live MongoDB catalog.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            /* Loading Shimmer State */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array(6)
                .fill(null)
                .map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            /* Empty matches State */
            <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white rounded-3xl p-16 text-center space-y-4 shadow-sm">
              <div className="bg-amber-50 p-6 rounded-full text-secondary">
                <AlertTriangle className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="font-display font-bold text-slate-800 text-lg">No Matching Products Found</h3>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                We couldn't locate any products that fit your active filtering criteria. Try loosening up your boundaries or resetting search parameters.
              </p>
              <button
                onClick={handleClearAll}
                className="btn-primary flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            /* Active Grid list */
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </motion.div>
          )}

          {/* Pagination Controls */}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-8 mt-12">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-semibold text-slate-600 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
              
              <span className="text-xs text-slate-400 font-medium">
                Page <span className="font-bold text-darkSlate-800">{page}</span> of {pages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={page === pages}
                className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-semibold text-slate-600 transition"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;
