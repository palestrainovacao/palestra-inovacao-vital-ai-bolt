import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Pill,
  DollarSign,
  FileText,
  Settings,
  X,
  Footprints,
  Heart,
  Brain,
  Bell
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, user }) => {
  // Define navigation items
  const navigationItems = [
    { to: '/', icon: Home, label: 'Dashboard', color: 'text-blue-600' },
    { to: '/residents', icon: Users, label: 'Residentes', color: 'text-green-600' },
    { to: '/medications', icon: Pill, label: 'Medicamentos', color: 'text-purple-600' },
    { to: '/diaper-usage', icon: Footprints, label: 'Controle de Fraldas', color: 'text-cyan-600', adminOnly: false },
    { to: '/health-records', icon: Heart, label: 'Registros de Saúde', color: 'text-red-600' },
    { to: '/financial', icon: DollarSign, label: 'Financeiro', color: 'text-emerald-600' },
    { to: '/ai-analytics', icon: Brain, label: 'Análise com IA', color: 'text-purple-600' },
    { to: '/notifications', icon: Bell, label: 'Notificações', color: 'text-yellow-600' },
    { to: '/reports', icon: FileText, label: 'Relatórios', color: 'text-indigo-600' },
    { to: '/settings', icon: Settings, label: 'Configurações', color: 'text-gray-600' }
  ];

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(item => 
    !item.adminOnly || (user && user.role === 'admin')
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
        w-64 lg:w-64 flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">ILPI Manager</h1>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredNavigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }
              `}
              onClick={() => window.innerWidth < 1024 && onToggle()}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            ILPI Manager v1.0
            <br />
            Sistema de Gestão de Idosos
          </div>
        </div>
      </div>
    </>
  );
};
