import React from 'react';
import { Bell, Download, Filter, RefreshCw } from 'lucide-react';
import { NotificationList } from '../components/notifications/NotificationList';
import { useNotifications } from '../contexts/NotificationContext';

export const Notifications: React.FC = () => {
  const { refreshNotifications, summary } = useNotifications();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-600">Gerencie todas as notificações do sistema</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={() => refreshNotifications()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total de Notificações</p>
              <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Não Lidas</p>
              <p className="text-3xl font-bold text-gray-900">{summary.unread}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Críticas</p>
              <p className="text-3xl font-bold text-gray-900">{summary.critical}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Insights de IA</p>
              <p className="text-3xl font-bold text-gray-900">{summary.byCategory.ai}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <NotificationList />
    </div>
  );
};
