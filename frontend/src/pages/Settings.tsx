import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Slider,
  Button,
  Divider,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const Settings: React.FC = () => {
  const { isDarkMode, isHighContrast, toggleDarkMode, toggleHighContrast } = useTheme();
  const {
    simulationSettings,
    uiPreferences,
    updateSimulationSettings,
    updateUIPreferences,
    resetSettings,
  } = useSettings();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Theme Settings
        </Typography>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={<Switch checked={isDarkMode} onChange={toggleDarkMode} />}
            label="Dark Mode"
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={<Switch checked={isHighContrast} onChange={toggleHighContrast} />}
            label="High Contrast Mode"
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Simulation Settings
        </Typography>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Color Blindness Type</InputLabel>
            <Select
              value={simulationSettings.colorBlindnessType}
              label="Color Blindness Type"
              onChange={(e) =>
                updateSimulationSettings({
                  colorBlindnessType: e.target.value as SimulationSettings['colorBlindnessType'],
                })
              }
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="protanopia">Protanopia</MenuItem>
              <MenuItem value="deuteranopia">Deuteranopia</MenuItem>
              <MenuItem value="tritanopia">Tritanopia</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={simulationSettings.screenReaderEnabled}
                onChange={(e) =>
                  updateSimulationSettings({ screenReaderEnabled: e.target.checked })
                }
              />
            }
            label="Screen Reader"
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={simulationSettings.keyboardNavigationEnabled}
                onChange={(e) =>
                  updateSimulationSettings({ keyboardNavigationEnabled: e.target.checked })
                }
              />
            }
            label="Keyboard Navigation"
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Font Size</Typography>
          <Slider
            value={simulationSettings.fontSize}
            min={12}
            max={24}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, value) => updateSimulationSettings({ fontSize: value as number })}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Editor Settings
        </Typography>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={uiPreferences.sidebarExpanded}
                onChange={(e) => updateUIPreferences({ sidebarExpanded: e.target.checked })}
              />
            }
            label="Expand Sidebar by Default"
          />
        </Box>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Editor Theme</InputLabel>
            <Select
              value={uiPreferences.codeEditorTheme}
              label="Editor Theme"
              onChange={(e) => updateUIPreferences({ codeEditorTheme: e.target.value as string })}
            >
              <MenuItem value="vs-dark">Dark</MenuItem>
              <MenuItem value="vs-light">Light</MenuItem>
              <MenuItem value="hc-black">High Contrast</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={uiPreferences.showLineNumbers}
                onChange={(e) => updateUIPreferences({ showLineNumbers: e.target.checked })}
              />
            }
            label="Show Line Numbers"
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={uiPreferences.autoSave}
                onChange={(e) => updateUIPreferences({ autoSave: e.target.checked })}
              />
            }
            label="Auto Save"
          />
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="error" onClick={resetSettings}>
          Reset All Settings
        </Button>
      </Box>
    </Container>
  );
};

export default Settings; 