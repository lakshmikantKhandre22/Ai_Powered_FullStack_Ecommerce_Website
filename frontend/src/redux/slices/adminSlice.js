import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api.js';

// --- ADMIN ANALYTICS ---

export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics statistics.');
    }
  }
);

// --- ADMIN PRODUCT CRUD ---

export const createProductAdmin = createAsyncThunk(
  'admin/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await API.post('/products', productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate product.');
    }
  }
);

export const updateProductAdmin = createAsyncThunk(
  'admin/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to modify product.');
    }
  }
);

export const deleteProductAdmin = createAsyncThunk(
  'admin/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/products/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product.');
    }
  }
);

// --- ADMIN CATEGORY CRUD ---

export const createCategoryAdmin = createAsyncThunk(
  'admin/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await API.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create category.');
    }
  }
);

export const updateCategoryAdmin = createAsyncThunk(
  'admin/updateCategory',
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category.');
    }
  }
);

export const deleteCategoryAdmin = createAsyncThunk(
  'admin/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/categories/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category.');
    }
  }
);

// --- ADMIN ORDER MANAGEMENT ---

export const fetchAdminOrders = createAsyncThunk(
  'admin/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/orders');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load orders.');
    }
  }
);

export const updateOrderStatusAdmin = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ id, orderStatus, paymentStatus }, { rejectWithValue, dispatch }) => {
    try {
      const response = await API.put(`/orders/${id}/status`, { orderStatus, paymentStatus });
      dispatch(fetchAdminOrders()); // reload orders list
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update shipping status.');
    }
  }
);

// --- ADMIN USER CONTROL ---

export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/users');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to retrieve accounts catalog.');
    }
  }
);

export const updateUserRoleAdmin = createAsyncThunk(
  'admin/updateUserRole',
  async ({ id, role }, { rejectWithValue, dispatch }) => {
    try {
      const response = await API.put(`/admin/users/${id}/role`, { role });
      dispatch(fetchAdminUsers());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to modify account permissions.');
    }
  }
);

export const deleteUserAdmin = createAsyncThunk(
  'admin/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/admin/users/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user.');
    }
  }
);

const initialState = {
  stats: null,
  monthlySales: [],
  categorySales: [],
  recentOrders: [],
  orders: [],
  users: [],
  loading: false,
  ordersLoading: false,
  usersLoading: false,
  error: null,
  success: false
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    resetAdminSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // DASHBOARD METRICS
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.monthlySales = action.payload.monthlySales;
        state.categorySales = action.payload.categorySales;
        state.recentOrders = action.payload.recentOrders;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE PRODUCT
      .addCase(createProductAdmin.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(createProductAdmin.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createProductAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE PRODUCT
      .addCase(updateProductAdmin.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(updateProductAdmin.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateProductAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE PRODUCT
      .addCase(deleteProductAdmin.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(deleteProductAdmin.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteProductAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // CREATE CATEGORY
      .addCase(createCategoryAdmin.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(createCategoryAdmin.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createCategoryAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE CATEGORY
      .addCase(updateCategoryAdmin.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(updateCategoryAdmin.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateCategoryAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE CATEGORY
      .addCase(deleteCategoryAdmin.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(deleteCategoryAdmin.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteCategoryAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH ADMIN ORDERS
      .addCase(fetchAdminOrders.pending, (state) => {
        state.ordersLoading = true;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload.orders;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.error = action.payload;
      })

      // FETCH ADMIN USERS
      .addCase(fetchAdminUsers.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.users;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload;
      })

      // DELETE USER
      .addCase(deleteUserAdmin.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u._id !== action.payload);
      });
  }
});

export const { clearAdminError, resetAdminSuccess } = adminSlice.actions;
export default adminSlice.reducer;
