import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  FormControlLabel,
  Switch,
  FormGroup,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface SimulationControlsProps {
  onClose: () => void;
}

type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export const SimulationControls: React.FC<SimulationControlsProps> = ({ onClose }) => {
  const [colorBlindness, setColorBlindness] = useState(false);
  const [colorBlindnessType, setColorBlindnessType] = useState<ColorBlindnessType>('deuteranopia');
  const [keyboardOnly, setKeyboardOnly] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  // Color blindness filter configurations
  const colorBlindnessFilters = {
    protanopia: 'filter: url("#protanopia-filter") !important;',
    deuteranopia: 'filter: url("#deuteranopia-filter") !important;',
    tritanopia: 'filter: url("#tritanopia-filter") !important;',
    achromatopsia: 'filter: grayscale(100%) !important;'
  };

  // Apply color blindness simulation
  useEffect(() => {
    if (colorBlindness) {
      // Create SVG filters for different types of color blindness
      const svgFilters = document.createElement('div');
      svgFilters.innerHTML = `
        <svg style="display: none">
          <defs>
            <!-- Protanopia (red-blind) -->
            <filter id="protanopia-filter">
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values="0.567, 0.433, 0,     0, 0
                        0.558, 0.442, 0,     0, 0
                        0,     0.242, 0.758, 0, 0
                        0,     0,     0,     1, 0"/>
            </filter>
            
            <!-- Deuteranopia (green-blind) -->
            <filter id="deuteranopia-filter">
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values="0.625, 0.375, 0,   0, 0
                        0.7,   0.3,   0,   0, 0
                        0,     0.3,   0.7, 0, 0
                        0,     0,     0,   1, 0"/>
            </filter>
            
            <!-- Tritanopia (blue-blind) -->
            <filter id="tritanopia-filter">
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values="0.95, 0.05,  0,     0, 0
                        0,    0.433, 0.567, 0, 0
                        0,    0.475, 0.525, 0, 0
                        0,    0,     0,     1, 0"/>
            </filter>
          </defs>
        </svg>
      `;
      document.body.appendChild(svgFilters);

      // Apply the selected color blindness filter
      const style = document.createElement('style');
      style.innerHTML = `
        html {
          ${colorBlindnessFilters[colorBlindnessType]}
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.body.removeChild(svgFilters);
        document.head.removeChild(style);
      };
    }
  }, [colorBlindness, colorBlindnessType]);

  // Apply keyboard-only navigation
  useEffect(() => {
    if (keyboardOnly) {
      // Enhance keyboard focus visibility without disabling mouse
      const style = document.createElement('style');
      style.innerHTML = `
        *:focus {
          outline: 3px solid #1976d2 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.4) !important;
        }
        /* Enhance visible focus indicators */
        a:focus, button:focus, input:focus, select:focus, textarea:focus {
          background-color: rgba(25, 118, 210, 0.1) !important;
        }
        /* Add focus indication for interactive elements */
        a:hover, button:hover {
          outline: 1px solid #1976d2;
          outline-offset: 1px;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [keyboardOnly]);

  // Apply screen reader mode
  useEffect(() => {
    if (screenReader) {
      // Add ARIA announcements and enhance screen reader experience
      const style = document.createElement('style');
      style.innerHTML = `
        [aria-hidden="true"] {
          display: none !important;
        }
        .visually-hidden {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          border: 0 !important;
        }
      `;
      document.head.appendChild(style);

      // Announce screen reader mode is active
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'alert');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'visually-hidden';
      announcement.textContent = 'Screen reader mode is now active';
      document.body.appendChild(announcement);

      return () => {
        document.head.removeChild(style);
        if (announcement.parentNode) {
          announcement.parentNode.removeChild(announcement);
        }
      };
    }
  }, [screenReader]);

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Accessibility Simulation Controls
        </Typography>
        <Button
          onClick={onClose}
          startIcon={<CloseIcon />}
          sx={{ color: 'primary.main' }}
        >
          CLOSE
        </Button>
      </Box>
      <FormGroup>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={colorBlindness}
                onChange={(e) => setColorBlindness(e.target.checked)}
                name="colorBlindness"
              />
            }
            label="Color Blindness Simulation"
          />
          {colorBlindness && (
            <FormControl size="small" sx={{ ml: 2, minWidth: 120 }}>
              <Select
                value={colorBlindnessType}
                onChange={(e) => setColorBlindnessType(e.target.value as ColorBlindnessType)}
                displayEmpty
              >
                <MenuItem value="protanopia">Protanopia (red-blind)</MenuItem>
                <MenuItem value="deuteranopia">Deuteranopia (green-blind)</MenuItem>
                <MenuItem value="tritanopia">Tritanopia (blue-blind)</MenuItem>
                <MenuItem value="achromatopsia">Achromatopsia (no color)</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={keyboardOnly}
              onChange={(e) => setKeyboardOnly(e.target.checked)}
              name="keyboardOnly"
            />
          }
          label="Keyboard-Only Navigation"
        />
        <FormControlLabel
          control={
            <Switch
              checked={screenReader}
              onChange={(e) => setScreenReader(e.target.checked)}
              name="screenReader"
            />
          }
          label="Screen Reader Mode"
        />
      </FormGroup>
    </Box>
  );
}; 