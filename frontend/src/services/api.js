import axios from 'axios';

let accessToken = null;

export const setToken = (token) => {
  accessToken = token;
};

export const getToken = () => accessToken;

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Necessary to send/receive httpOnly cookies for refresh token
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiry seamlessly
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error is due to an expired token and we haven't retried yet
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data.message === 'Token Expired' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      try {
        // Attempt to silently refresh the access token via the httpOnly cookie
        const res = await axios.get('http://localhost:5000/api/auth/refresh', {
          withCredentials: true,
        });

        if (res.data.success) {
          // Save new access token in memory
          setToken(res.data.accessToken);
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails (e.g. token revoked, expired), force logout
        setToken(null);
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // For any other 401 (e.g. Invalid Token, User Not Found), redirect to login
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      setToken(null);
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
