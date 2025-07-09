import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Eye, 
  Type, 
  Contrast, 
  PanelLeft, 
  Bell, 
  Save,
  RotateCcw,
  Check,
  X,
  Building,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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

const defaultSettings: UserSettings = {
  theme: 'light',
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  sidebarCollapsed: false,
  notificationsEnabled: true,
  soundEnabled: true
};

export const Settings: React.FC = () => {
  const { user, getOrganizations, createOrganization, setCurrentOrganization } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'appearance' | 'accessibility' | 'notifications' | 'account' | 'organization'>('appearance');
  
  // Organization state
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [orgSuccess, setOrgSuccess] = useState('');
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);

  // Load user settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('settings')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error loading settings:', error);
          return;
        }
        
        if (data && data.settings) {
          setSettings({
            ...defaultSettings,
            ...data.settings
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  // Load organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!user || activeTab !== 'organization') return;
      
      setIsLoadingOrgs(true);
      try {
        const orgs = await getOrganizations();
        setOrganizations(orgs);
      } catch (error) {
        console.error('Error loading organizations:', error);
        setOrgError('Erro ao carregar organizações');
      } finally {
        setIsLoadingOrgs(false);
      }
    };
    
    loadOrganizations();
  }, [user, activeTab, getOrganizations]);

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

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveSuccess(null);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          settings: settings
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error saving settings:', error);
        setSaveSuccess(false);
        return;
      }
      
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
  };

  const handleCreateNewOrganization = async () => {
    if (!newOrgName.trim()) {
      setOrgError('O nome da organização é obrigatório');
      return;
    }

    setIsCreatingOrg(true);
    setOrgError('');
    setOrgSuccess('');

    try {
      // Create the organization
      const orgId = await createOrganization(newOrgName);
      
      if (!orgId) {
        setOrgError('Erro ao criar organização. Tente novamente.');
        return;
      }

      // Switch to the new organization
      const success = await setCurrentOrganization(orgId);
      
      if (!success) {
        setOrgError('Organização criada, mas não foi possível trocar para ela. Tente novamente.');
        // Refresh organizations list
        const orgs = await getOrganizations();
        setOrganizations(orgs);
        return;
      }

      setOrgSuccess('Organização criada com sucesso! Redirecionando...');
      setNewOrgName('');
      setShowNewOrgForm(false);
      
      // Reload the page after a short delay to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error creating organization:', error);
      setOrgError('Erro ao criar organização. Tente novamente.');
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleSwitchOrganization = async (orgId: string) => {
    if (!user || user.organizationId === orgId) return;
    
    setIsLoadingOrgs(true);
    setOrgError('');
    setOrgSuccess('');
    
    try {
      const success = await setCurrentOrganization(orgId);
      
      if (!success) {
        setOrgError('Erro ao trocar de organização. Tente novamente.');
        return;
      }
      
      setOrgSuccess('Organização alterada com sucesso! Redirecionando...');
      
      // Reload the page after a short delay to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error switching organization:', error);
      setOrgError('Erro ao trocar de organização. Tente novamente.');
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Personalize sua experiência no sistema</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleResetSettings}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrões</span>
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* Save Status Message */}
      {saveSuccess !== null && (
        <div className={`p-4 rounded-lg ${
          saveSuccess ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {saveSuccess ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <span>
              {saveSuccess 
                ? 'Configurações salvas com sucesso!' 
                : 'Erro ao salvar configurações. Tente novamente.'}
            </span>
          </div>
        </div>
      )}

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'appearance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sun className="w-4 h-4" />
                <span>Aparência</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('accessibility')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'accessibility'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Acessibilidade</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notificações</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('organization')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'organization'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Organizações</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'account'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <SettingsIcon className="w-4 h-4" />
                <span>Conta</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="p-6">
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tema</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      settings.theme === 'light' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'light' }))}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Sun className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium">Claro</span>
                      </div>
                      {settings.theme === 'light' && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-3 flex items-center justify-center">
                      <div className="w-full h-4 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      settings.theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'dark' }))}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Moon className="w-5 h-5 text-indigo-500" />
                        <span className="font-medium">Escuro</span>
                      </div>
                      {settings.theme === 'dark' && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-md p-3 flex items-center justify-center">
                      <div className="w-full h-4 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      settings.theme === 'system' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'system' }))}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          <Sun className="w-5 h-5 text-yellow-500" />
                          <Moon className="w-5 h-5 text-indigo-500 -ml-1" />
                        </div>
                        <span className="font-medium">Sistema</span>
                      </div>
                      {settings.theme === 'system' && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="bg-gradient-to-r from-white to-gray-800 border border-gray-200 rounded-md p-3 flex items-center justify-center">
                      <div className="w-full h-4 bg-gradient-to-r from-gray-100 to-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Barra Lateral</h3>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <PanelLeft className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Recolher barra lateral</p>
                      <p className="text-sm text-gray-500">Recolher automaticamente a barra lateral em telas menores</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.sidebarCollapsed}
                      onChange={() => setSettings(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }))}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tamanho da Fonte</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      settings.fontSize === 'small' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSettings(prev => ({ ...prev, fontSize: 'small' }))}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Type className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm">Pequena</span>
                      </div>
                      {settings.fontSize === 'small' && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      settings.fontSize === 'medium' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSettings(prev => ({ ...prev, fontSize: 'medium' }))}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Type className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">Média</span>
                      </div>
                      {settings.fontSize === 'medium' && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      settings.fontSize === 'large' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSettings(prev => ({ ...prev, fontSize: 'large' }))}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Type className="w-6 h-6 text-gray-500" />
                        <span className="font-medium text-lg">Grande</span>
                      </div>
                      {settings.fontSize === 'large' && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Opções de Acessibilidade</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Contrast className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">Alto Contraste</p>
                        <p className="text-sm text-gray-500">Aumenta o contraste para melhor legibilidade</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.highContrast}
                        onChange={() => setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 flex items-center justify-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                          <line x1="4" y1="22" x2="4" y2="15"></line>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Reduzir Movimento</p>
                        <p className="text-sm text-gray-500">Reduz ou remove animações e transições</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.reducedMotion}
                        onChange={() => setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preferências de Notificação</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">Notificações no Sistema</p>
                        <p className="text-sm text-gray-500">Receber notificações dentro do sistema</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.notificationsEnabled}
                        onChange={() => setSettings(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 flex items-center justify-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 18a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8z"></path>
                          <path d="M12 18v4"></path>
                          <path d="M12 2v4"></path>
                          <path d="M12 12v2"></path>
                          <path d="M2 12h4"></path>
                          <path d="M18 12h4"></path>
                          <path d="M4.93 4.93l2.83 2.83"></path>
                          <path d="M16.24 16.24l2.83 2.83"></path>
                          <path d="M4.93 19.07l2.83-2.83"></path>
                          <path d="M16.24 7.76l2.83-2.83"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Sons de Notificação</p>
                        <p className="text-sm text-gray-500">Reproduzir sons ao receber notificações</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.soundEnabled}
                        onChange={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-6">
              {/* Organization Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Building className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800">Organização Atual</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {user?.organizationId ? (
                        <>
                          Você está na organização <strong>{organizations.find(o => o.id === user.organizationId)?.name || 'Carregando...'}</strong>
                        </>
                      ) : (
                        'Você não está associado a nenhuma organização'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Success/Error Messages */}
              {orgSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-700">{orgSuccess}</span>
                  </div>
                </div>
              )}

              {orgError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <X className="w-5 h-5 text-red-600" />
                    <span className="text-red-700">{orgError}</span>
                  </div>
                </div>
              )}

              {/* Create New Organization */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Criar Nova Organização</h3>
                  <button
                    onClick={() => setShowNewOrgForm(!showNewOrgForm)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                  >
                    {showNewOrgForm ? (
                      <>
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Nova Organização</span>
                      </>
                    )}
                  </button>
                </div>

                {showNewOrgForm && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Organização
                      </label>
                      <input
                        type="text"
                        id="orgName"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Minha ILPI"
                      />
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      <p className="font-medium">Importante:</p>
                      <p>Ao criar uma nova organização, você será redirecionado para ela e começará com dados vazios.</p>
                    </div>
                    <button
                      onClick={handleCreateNewOrganization}
                      disabled={isCreatingOrg || !newOrgName.trim()}
                      className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingOrg ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Criando...</span>
                        </>
                      ) : (
                        <>
                          <Building className="w-4 h-4" />
                          <span>Criar e Trocar para Nova Organização</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Available Organizations */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organizações Disponíveis</h3>
                
                {isLoadingOrgs ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-500">Carregando organizações...</p>
                  </div>
                ) : organizations.length > 0 ? (
                  <div className="space-y-3">
                    {organizations.map(org => (
                      <div 
                        key={org.id} 
                        className={`p-4 border rounded-lg flex items-center justify-between ${
                          org.id === user?.organizationId 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Building className={`w-5 h-5 ${
                            org.id === user?.organizationId ? 'text-blue-600' : 'text-gray-500'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{org.name}</p>
                            <p className="text-xs text-gray-500">
                              Criada em {new Date(org.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        {org.id === user?.organizationId ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Atual
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSwitchOrganization(org.id)}
                            className="px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200 text-xs font-medium rounded-full transition-colors"
                          >
                            Trocar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma organização encontrada</p>
                    <p className="text-sm text-gray-400 mt-1">Crie uma nova organização para começar</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Conta</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Nome</p>
                      <p className="font-medium text-gray-900">{user?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Função</p>
                      <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Segurança</h3>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 flex items-center justify-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Alterar Senha</p>
                        <p className="text-sm text-gray-500">Atualize sua senha de acesso</p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 flex items-center justify-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Configurações de Privacidade</p>
                        <p className="text-sm text-gray-500">Gerencie suas preferências de privacidade</p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
