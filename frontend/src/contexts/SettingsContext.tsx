import React, { createContext, useContext, useState, useEffect } from 'react';

interface SimulationSettings {
  colorBlindnessType: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none';
  screenReaderEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  fontSize: number;
}

interface UIPreferences {
  sidebarExpanded: boolean;
  codeEditorTheme: string;
  showLineNumbers: boolean;
  autoSave: boolean;
}

interface SettingsContextType {
  simulationSettings: SimulationSettings;
  uiPreferences: UIPreferences;
  updateSimulationSettings: (settings: Partial<SimulationSettings>) => void;
  updateUIPreferences: (preferences: Partial<UIPreferences>) => void;
  resetSettings: () => void;
}

const defaultSimulationSettings: SimulationSettings = {
  colorBlindnessType: 'none',
  screenReaderEnabled: false,
  keyboardNavigationEnabled: false,
  fontSize: 16,
};

const defaultUIPreferences: UIPreferences = {
  sidebarExpanded: true,
  codeEditorTheme: 'vs-dark',
  showLineNumbers: true,
  autoSave: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>(() => {
    const saved = localStorage.getItem('simulationSettings');
    return saved ? JSON.parse(saved) : defaultSimulationSettings;
  });

  const [uiPreferences, setUIPreferences] = useState<UIPreferences>(() => {
    const saved = localStorage.getItem('uiPreferences');
    return saved ? JSON.parse(saved) : defaultUIPreferences;
  });

  useEffect(() => {
    localStorage.setItem('simulationSettings', JSON.stringify(simulationSettings));
  }, [simulationSettings]);

  useEffect(() => {
    localStorage.setItem('uiPreferences', JSON.stringify(uiPreferences));
  }, [uiPreferences]);

  const updateSimulationSettings = (settings: Partial<SimulationSettings>) => {
    setSimulationSettings((prev) => ({
      ...prev,
      ...settings,
    }));
  };

  const updateUIPreferences = (preferences: Partial<UIPreferences>) => {
    setUIPreferences((prev) => ({
      ...prev,
      ...preferences,
    }));
  };

  const resetSettings = () => {
    setSimulationSettings(defaultSimulationSettings);
    setUIPreferences(defaultUIPreferences);
  };

  const value = {
    simulationSettings,
    uiPreferences,
    updateSimulationSettings,
    updateUIPreferences,
    resetSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}; 