import axios from 'axios';

const API_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', config.url);
    const token = localStorage.getItem('token');
    console.log('Token in request:', token ? 'exists' : 'not found');
    
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Added Authorization header:', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Received successful response:', {
      url: response.config.url,
      status: response.status,
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Handle 401 errors
    if (error.response?.status === 401) {
      console.log('Received 401 unauthorized response');
      
      // Don't clear token for login/register endpoints
      if (!error.config?.url?.includes('/auth/')) {
        console.log('Clearing token and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 