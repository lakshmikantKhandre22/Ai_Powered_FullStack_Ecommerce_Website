import axios from 'axios';

// Ensure baseURL ends with /api if not present, and handle potential trailing slash
let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (!baseURL.endsWith('/api') && !baseURL.endsWith('/api/')) {
  baseURL = baseURL.endsWith('/') ? `${baseURL}api` : `${baseURL}/api`;
}

const API = axios.create({
  baseURL,
  withCredentials: true, // Crucial to enable sending HttpOnly cookies for token refreshes
  headers: {
    'Content-Type': 'application/json'
  }
});


// Request Interceptor: Automatically inject the access token if available in state/storage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle token expiration and auto-refresh sessions on 401 errors
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log('[ShopSphere] Session expired. Attempting token rotation...');
        // Request token refresh
        const res = await axios.post(
          `${baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = res.data;
        localStorage.setItem('token', accessToken);
        
        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        console.warn('[ShopSphere] Session rotation failed. Redirecting to login.');
        localStorage.removeItem('token');
        // Optional: Trigger global redirect or reset auth slice
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;
