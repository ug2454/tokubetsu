import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const validateToken = async () => {
    console.log('Validating token...');
    const token = localStorage.getItem('token');
    console.log('Token found:', !!token);

    if (!token) {
      console.log('No token found, setting unauthenticated');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching user data with token...');
      const response = await api.get('/api/user');
      console.log('User data fetched successfully:', response.data);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('AuthProvider mounted, validating token...');
    validateToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with email:', email);
      console.log('Login request payload:', { email, password: '***' });
      
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });
      
      console.log('Login response status:', response.status);
      console.log('Login response data:', response.data);
      
      const { token, user } = response.data;
      console.log('Extracted token and user:', { token: token ? 'exists' : 'missing', user });
      
      // Store token and update state
      localStorage.setItem('token', token);
      console.log('Token stored in localStorage');
      
      setUser(user);
      setIsAuthenticated(true);
      console.log('User state updated, authenticated:', true);
      
      // Validate the token immediately after login
      await validateToken();
      console.log('Token validation completed after login');
    } catch (error: any) {
      console.error('Login failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response'
      });
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      console.log('Attempting registration...');
      const response = await api.post('/api/auth/register', {
        name,
        email,
        password,
        role,
      });
      console.log('Registration response:', response.data);
      const { token, user } = response.data;
      
      // Store token and update state
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      
      // Validate the token immediately after registration
      await validateToken();
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};