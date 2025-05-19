import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import ReactDOM from 'react-dom';
import axe from '@axe-core/react';

const App: React.FC = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const config = {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'aria-roles', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'image-alt', enabled: true },
          { id: 'label', enabled: true },
          { id: 'link-name', enabled: true }
        ]
      };
      axe(React, ReactDOM, 1000, config);
    }
  }, []);

  return (
    <React.StrictMode>
      <Router>
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </Router>
    </React.StrictMode>
  );
};

export default App; 