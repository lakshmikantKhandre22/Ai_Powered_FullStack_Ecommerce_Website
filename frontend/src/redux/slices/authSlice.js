import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api.js';

// Asynchronous Thunk: Login User
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/login', credentials);
      localStorage.setItem('token', response.data.accessToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    }
  }
);

// Asynchronous Thunk: Register User
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
    }
  }
);

// Asynchronous Thunk: Verify OTP
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/verify', otpData);
      localStorage.setItem('token', response.data.accessToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Invalid or expired verification OTP.'
      );
    }
  }
);

// Asynchronous Thunk: Load Current Logged In User Session (Bootstrap)
export const loadMe = createAsyncThunk(
  'auth/loadMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/auth/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to authenticate active session.'
      );
    }
  }
);

// Asynchronous Thunk: Update User Profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await API.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Profile modification failed.'
      );
    }
  }
);

// Asynchronous Thunk: Logout User
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await API.post('/auth/logout');
      localStorage.removeItem('token');
      return null;
    } catch (error) {
      return rejectWithValue('Logout request failed.');
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
  registrationEmail: null,
  registrationSuccess: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthErrors: (state) => {
      state.error = null;
    },
    resetRegistrationState: (state) => {
      state.registrationSuccess = false;
      state.registrationEmail = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.registrationSuccess = true;
        state.registrationEmail = action.meta.arg.email;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // VERIFY OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
        state.registrationSuccess = false;
        state.registrationEmail = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOAD ME
      .addCase(loadMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadMe.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(loadMe.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
      })

      // UPDATE PROFILE
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  }
});

export const { clearAuthErrors, resetRegistrationState } = authSlice.actions;
export default authSlice.reducer;
