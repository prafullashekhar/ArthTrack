import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    success: string;
    warning: string;
    error: string;
    need: string;
    want: string;
    invest: string;
  };
  isDark: boolean;
}

const lightTheme: Theme = {
  colors: {
    background: '#f8f9fa',
    surface: '#ffffff',
    primary: '#007AFF',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e9ecef',
    card: '#ffffff',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    need: '#FF6B6B',
    want: '#4ECDC4',
    invest: '#45B7D1',
  },
  isDark: false,
};

const darkTheme: Theme = {
  colors: {
    background: '#121212',
    surface: '#1e1e1e',
    primary: '#0A84FF',
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    border: '#333333',
    card: '#2c2c2c',
    success: '#30d158',
    warning: '#ff9f0a',
    error: '#ff453a',
    need: '#FF6B6B',
    want: '#4ECDC4',
    invest: '#45B7D1',
  },
  isDark: true,
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const systemColorScheme = useColorScheme();
  
  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  useEffect(() => {
    loadThemeMode();
  }, []);
  
  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('theme-mode');
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setThemeMode(savedMode as ThemeMode);
      }
    } catch (error) {
      console.log('Error loading theme mode:', error);
    }
  };
  
  const saveThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('theme-mode', mode);
      setThemeMode(mode);
    } catch (error) {
      console.log('Error saving theme mode:', error);
    }
  }, []);
  
  return useMemo(() => ({
    theme,
    themeMode,
    setThemeMode: saveThemeMode,
    isDarkMode,
  }), [theme, themeMode, saveThemeMode, isDarkMode]);
});