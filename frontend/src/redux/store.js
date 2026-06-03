import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import productsReducer from './slices/productSlice.js';
import cartReducer from './slices/cartSlice.js';
import ordersReducer from './slices/orderSlice.js';
import adminReducer from './slices/adminSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    orders: ordersReducer,
    admin: adminReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false // Avoid serializability warnings with date/nested objects
    })
});

export default store;
