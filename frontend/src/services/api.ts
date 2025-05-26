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
        console.log('Clearing token due to 401 error');
        localStorage.removeItem('token');
        // Don't automatically redirect - let AuthContext handle it
        // This prevents unwanted logouts on page refresh
        console.log('Token cleared, AuthContext will handle redirect');
      }
    }
    return Promise.reject(error);
  }
);

export const getActivityLog = async (params?: { page?: number; limit?: number; type?: string; projectId?: string }) => {
  try {
    const response = await api.get('/api/activity', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching activity log:', error);
    throw error;
  }
};

export const getScans = async (params?: { page?: number; limit?: number; projectId?: string }) => {
  try {
    const response = await api.get('/api/scans', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching scans:', error);
    throw error;
  }
};

export default api; 