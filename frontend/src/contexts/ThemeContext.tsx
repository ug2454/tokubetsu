import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';

interface ThemeContextType {
  isDarkMode: boolean;
  isHighContrast: boolean;
  toggleDarkMode: () => void;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [isHighContrast, setIsHighContrast] = useState(() => {
    const saved = localStorage.getItem('highContrast');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('highContrast', JSON.stringify(isHighContrast));
  }, [isHighContrast]);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isHighContrast ? '#ffff00' : '#1976d2',
      },
      secondary: {
        main: isHighContrast ? '#00ffff' : '#dc004e',
      },
      background: {
        default: isDarkMode ? '#121212' : '#ffffff',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isHighContrast
          ? isDarkMode
            ? '#ffffff'
            : '#000000'
          : isDarkMode
          ? '#ffffff'
          : '#000000',
        secondary: isHighContrast
          ? isDarkMode
            ? '#ffffff'
            : '#000000'
          : isDarkMode
          ? '#b3b3b3'
          : '#666666',
      },
      contrastThreshold: isHighContrast ? 4.5 : 3,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const toggleHighContrast = () => {
    setIsHighContrast((prev) => !prev);
  };

  const value = {
    isDarkMode,
    isHighContrast,
    toggleDarkMode,
    toggleHighContrast,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 