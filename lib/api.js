import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    // Return data directly for easier consumption
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`;
      }
    }

    // Standardize error message extraction
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    // Attach original error status and message to the thrown error for specific component handling
    const customError = new Error(errorMessage);
    customError.status = error.response?.status;
    customError.apiMessage = error.response?.data?.message;
    customError.originalError = error;

    return Promise.reject(customError);
  }
);

export default api;
