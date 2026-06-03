import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api.js';

// --- DATABASE CART ASYNC THUNKS ---

export const fetchCartDB = createAsyncThunk(
  'cart/fetchCartDB',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/cart');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart.');
    }
  }
);

export const addToCartDB = createAsyncThunk(
  'cart/addToCartDB',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await API.post('/cart/add', { productId, quantity });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add item to cart.');
    }
  }
);

export const updateCartQtyDB = createAsyncThunk(
  'cart/updateCartQtyDB',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await API.put('/cart/update', { productId, quantity });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update quantity.');
    }
  }
);

export const removeFromCartDB = createAsyncThunk(
  'cart/removeFromCartDB',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/cart/remove/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove item.');
    }
  }
);

export const syncCartDB = createAsyncThunk(
  'cart/syncCartDB',
  async (products, { rejectWithValue }) => {
    try {
      const response = await API.post('/cart/sync', { products });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync offline cart.');
    }
  }
);

// --- DATABASE WISHLIST ASYNC THUNKS ---

export const fetchWishlistDB = createAsyncThunk(
  'cart/fetchWishlistDB',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/wishlist');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist.');
    }
  }
);

export const addToWishlistDB = createAsyncThunk(
  'cart/addToWishlistDB',
  async (productId, { rejectWithValue, dispatch }) => {
    try {
      const response = await API.post('/wishlist', { productId });
      dispatch(fetchWishlistDB());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist.');
    }
  }
);

export const removeFromWishlistDB = createAsyncThunk(
  'cart/removeFromWishlistDB',
  async (productId, { rejectWithValue, dispatch }) => {
    try {
      const response = await API.delete(`/wishlist/${productId}`);
      dispatch(fetchWishlistDB());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist.');
    }
  }
);


// Load initial guest cart from local storage
const loadGuestCart = () => {
  try {
    const serialized = localStorage.getItem('guestCart');
    return serialized ? JSON.parse(serialized) : [];
  } catch (err) {
    return [];
  }
};

const initialState = {
  cartItems: loadGuestCart(), // Array of { productId: { ... }, quantity }
  wishlist: [], // Array of { productId: { ... } }
  loading: false,
  wishlistLoading: false,
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Guest Reducers (Non-Logged in actions)
    addToGuestCart: (state, action) => {
      const { product, quantity } = action.payload;
      const existingIndex = state.cartItems.findIndex(item => item.productId._id === product._id);
      
      if (existingIndex > -1) {
        state.cartItems[existingIndex].quantity += quantity;
      } else {
        state.cartItems.push({ productId: product, quantity });
      }
      localStorage.setItem('guestCart', JSON.stringify(state.cartItems));
    },
    updateGuestCartQty: (state, action) => {
      const { productId, quantity } = action.payload;
      const existingIndex = state.cartItems.findIndex(item => item.productId._id === productId);
      
      if (existingIndex > -1) {
        state.cartItems[existingIndex].quantity = quantity;
      }
      localStorage.setItem('guestCart', JSON.stringify(state.cartItems));
    },
    removeFromGuestCart: (state, action) => {
      const productId = action.payload;
      state.cartItems = state.cartItems.filter(item => item.productId._id !== productId);
      localStorage.setItem('guestCart', JSON.stringify(state.cartItems));
    },
    clearGuestCart: (state) => {
      state.cartItems = [];
      localStorage.removeItem('guestCart');
    },
    clearCartOnLogout: (state) => {
      state.cartItems = [];
      state.wishlist = [];
      state.error = null;
      localStorage.removeItem('guestCart');
    }
  },
  extraReducers: (builder) => {
    builder
      // FETCH DB CART
      .addCase(fetchCartDB.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCartDB.fulfilled, (state, action) => {
        state.loading = false;
        state.cartItems = action.payload.cart.products;
      })
      .addCase(fetchCartDB.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ADD TO DB CART
      .addCase(addToCartDB.fulfilled, (state, action) => {
        state.cartItems = action.payload.cart.products;
      })
      .addCase(addToCartDB.rejected, (state, action) => {
        state.error = action.payload;
      })

      // UPDATE DB CART QUANTITY
      .addCase(updateCartQtyDB.fulfilled, (state, action) => {
        state.cartItems = action.payload.cart.products;
      })
      .addCase(updateCartQtyDB.rejected, (state, action) => {
        state.error = action.payload;
      })

      // REMOVE FROM DB CART
      .addCase(removeFromCartDB.fulfilled, (state, action) => {
        state.cartItems = action.payload.cart.products;
      })

      // SYNC CART
      .addCase(syncCartDB.fulfilled, (state, action) => {
        state.cartItems = action.payload.cart.products;
        localStorage.removeItem('guestCart'); // Clear guest cart upon merge success
      })

      // FETCH WISHLIST
      .addCase(fetchWishlistDB.pending, (state) => {
        state.wishlistLoading = true;
      })
      .addCase(fetchWishlistDB.fulfilled, (state, action) => {
        state.wishlistLoading = false;
        state.wishlist = action.payload.wishlist;
      })
      .addCase(fetchWishlistDB.rejected, (state) => {
        state.wishlistLoading = false;
      });
  }
});

export const {
  addToGuestCart,
  updateGuestCartQty,
  removeFromGuestCart,
  clearGuestCart,
  clearCartOnLogout
} = cartSlice.actions;

export default cartSlice.reducer;
