import React, { useState } from 'react';
import { Menu, LogOut, Building, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout, getOrganizations, setCurrentOrganization } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // Load organizations when dropdown is opened
  const handleOrgDropdownToggle = async () => {
    if (!showOrgDropdown && organizations.length === 0) {
      setIsLoadingOrgs(true);
      try {
        const orgs = await getOrganizations();
        setOrganizations(orgs);
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setIsLoadingOrgs(false);
      }
    }
    setShowOrgDropdown(!showOrgDropdown);
  };

  const handleSwitchOrganization = async (orgId: string) => {
    try {
      await setCurrentOrganization(orgId);
      setShowOrgDropdown(false);
      // Reload the page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  };

  // Find current organization name
  const currentOrgName = organizations.find(org => org.id === user?.organizationId)?.name || 'Organização';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Bem-vindo, {user?.name}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Organization Selector */}
          <div className="relative">
            <button
              onClick={handleOrgDropdownToggle}
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Building className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700 hidden md:block">{currentOrgName}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            
            {showOrgDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Trocar Organização</h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {isLoadingOrgs ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Carregando...</p>
                    </div>
                  ) : organizations.length > 0 ? (
                    <div className="py-2">
                      {organizations.map(org => (
                        <button
                          key={org.id}
                          onClick={() => handleSwitchOrganization(org.id)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                            org.id === user?.organizationId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <Building className="w-4 h-4" />
                          <span>{org.name}</span>
                          {org.id === user?.organizationId && (
                            <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              Atual
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Nenhuma organização encontrada
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notification Dropdown */}
          <NotificationDropdown />

          <div className="flex items-center space-x-3">
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-red-600"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
