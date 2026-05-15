import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api', // FastAPI Backend URL
  timeout: 180000, // 3 min — allows for Render cold start (~75s) + AI generation time
});

console.log("🛠️ Frontend API Base URL is currently set to:", process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');

// Add a request interceptor to inject the JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add a response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Token expired or invalid
      localStorage.removeItem('token');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
