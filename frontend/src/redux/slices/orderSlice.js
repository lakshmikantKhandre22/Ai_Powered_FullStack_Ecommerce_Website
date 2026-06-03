import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api.js';

// Asynchronous Thunk: Place a new order
export const placeOrder = createAsyncThunk(
  'orders/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await API.post('/orders', orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to place your order. Please try again.'
      );
    }
  }
);

// Asynchronous Thunk: Get user orders history
export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/orders/my-orders');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve your order history.'
      );
    }
  }
);

// Asynchronous Thunk: Get order details by ID
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to retrieve order details.'
      );
    }
  }
);

// Asynchronous Thunk: Create Stripe Payment Intent
export const createPaymentIntent = createAsyncThunk(
  'orders/createPaymentIntent',
  async ({ amount, currency }, { rejectWithValue }) => {
    try {
      const response = await API.post('/payments/stripe/intent', { amount, currency });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to initialize payment gateway session.'
      );
    }
  }
);

// Asynchronous Thunk: Create Razorpay Order
export const createRazorpayOrderThunk = createAsyncThunk(
  'orders/createRazorpayOrder',
  async ({ amount, currency }, { rejectWithValue }) => {
    try {
      const response = await API.post('/payments/razorpay/order', { amount, currency });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to initialize Razorpay payment session.'
      );
    }
  }
);

// Asynchronous Thunk: Verify Razorpay Payment Signature
export const verifyRazorpayPaymentThunk = createAsyncThunk(
  'orders/verifyRazorpayPayment',
  async (verificationData, { rejectWithValue }) => {
    try {
      const response = await API.post('/payments/razorpay/verify', verificationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to verify payment transaction signature.'
      );
    }
  }
);

// Asynchronous Thunk: Save Gateway Payment Transaction record
export const savePaymentRecord = createAsyncThunk(
  'orders/savePaymentRecord',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await API.post('/payments/record', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to register transaction logs.'
      );
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  clientSecret: null,
  loading: false,
  ordersLoading: false,
  paymentLoading: false,
  error: null,
  success: false
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearCheckoutSession: (state) => {
      state.clientSecret = null;
      state.success = false;
      state.currentOrder = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // PLACE ORDER
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentOrder = action.payload.order;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH MY ORDERS
      .addCase(fetchMyOrders.pending, (state) => {
        state.ordersLoading = true;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload.orders;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.error = action.payload;
      })

      // FETCH ORDER DETAILS BY ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.order;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE STRIPE PAYMENT INTENT
      .addCase(createPaymentIntent.pending, (state) => {
        state.paymentLoading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.clientSecret = action.payload.clientSecret;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.paymentLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearOrderError, clearCheckoutSession } = orderSlice.actions;
export default orderSlice.reducer;
