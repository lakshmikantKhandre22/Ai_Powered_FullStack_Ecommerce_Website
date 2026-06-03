import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api.js';

// Asynchronous Thunk: Fetch Paginated Products Catalog with query filters
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await API.get('/products', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch catalog products.'
      );
    }
  }
);

// Asynchronous Thunk: Fetch Single Product details
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch product details.'
      );
    }
  }
);

// Asynchronous Thunk: Fetch Categories list
export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/categories');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve categories.'
      );
    }
  }
);

// Asynchronous Thunk: Fetch Product Reviews
export const fetchProductReviews = createAsyncThunk(
  'products/fetchReviews',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/reviews/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve product reviews.'
      );
    }
  }
);

// Asynchronous Thunk: Submit Product Review
export const addProductReview = createAsyncThunk(
  'products/addReview',
  async (reviewData, { rejectWithValue, dispatch }) => {
    try {
      const response = await API.post('/reviews', reviewData);
      // Automatically refresh reviews and product rating after adding a review
      dispatch(fetchProductReviews(reviewData.productId));
      dispatch(fetchProductById(reviewData.productId));
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to submit product review.'
      );
    }
  }
);

const initialState = {
  products: [],
  brands: [],
  categories: [],
  currentProduct: null,
  reviews: [],
  totalProducts: 0,
  page: 1,
  pages: 1,
  limit: 8,
  loading: false,
  detailLoading: false,
  reviewsLoading: false,
  error: null,
  
  // Active Filter state
  activeFilters: {
    search: '',
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sortBy: 'newest',
    page: 1
  }
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload, page: 1 };
    },
    setPage: (state, action) => {
      state.activeFilters.page = action.payload;
    },
    resetFilters: (state) => {
      state.activeFilters = {
        search: '',
        category: '',
        brand: '',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        sortBy: 'newest',
        page: 1
      };
    },
    clearProductDetails: (state) => {
      state.currentProduct = null;
      state.reviews = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // FETCH ALL PRODUCTS
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.brands = action.payload.brands;
        state.totalProducts = action.payload.totalProducts;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.limit = action.payload.limit;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH SINGLE PRODUCT
      .addCase(fetchProductById.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentProduct = action.payload.product;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // FETCH CATEGORIES
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
      })

      // FETCH REVIEWS
      .addCase(fetchProductReviews.pending, (state) => {
        state.reviewsLoading = true;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.reviews = action.payload.reviews;
      })
      .addCase(fetchProductReviews.rejected, (state) => {
        state.reviewsLoading = false;
      });
  }
});

export const { setFilter, setPage, resetFilters, clearProductDetails } = productSlice.actions;
export default productSlice.reducer;
