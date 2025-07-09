import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
  sidebarCollapsed: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: UserSettings = {
  theme: 'light',
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  sidebarCollapsed: false,
  notificationsEnabled: true,
  soundEnabled: true
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load user settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setSettings(defaultSettings);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('settings')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error loading settings:', error);
          setSettings(defaultSettings);
          return;
        }
        
        if (data && data.settings) {
          setSettings({
            ...defaultSettings,
            ...data.settings
          });
        } else {
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  // Apply theme and font size to document
  useEffect(() => {
    const applySettings = () => {
      // Apply theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark);
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Apply font size
      document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
      switch (settings.fontSize) {
        case 'small':
          document.documentElement.classList.add('text-sm');
          break;
        case 'medium':
          document.documentElement.classList.add('text-base');
          break;
        case 'large':
          document.documentElement.classList.add('text-lg');
          break;
      }
      
      // Apply high contrast
      if (settings.highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
      
      // Apply reduced motion
      if (settings.reducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };
    
    applySettings();
  }, [settings]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          settings: updatedSettings
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error saving settings:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  const resetSettings = async () => {
    if (!user) return;
    
    setSettings(defaultSettings);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          settings: defaultSettings
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error resetting settings:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      isLoading
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
