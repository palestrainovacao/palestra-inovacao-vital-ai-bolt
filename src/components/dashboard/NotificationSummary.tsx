import React from 'react';
import { 
  AlertTriangle, 
  Heart, 
  DollarSign, 
  MessageCircle, 
  Pill, 
  Calendar,
  TrendingUp,
  Users,
  Brain
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const NotificationSummary: React.FC = () => {
  const { notifications, summary } = useNotifications();
  const navigate = useNavigate();

  const criticalNotifications = notifications.filter(n => n.type === 'critical' && !n.read);
  const warningNotifications = notifications.filter(n => n.type === 'warning' && !n.read);

  const categoryIcons = {
    health: Heart,
    financial: DollarSign,
    family: MessageCircle,
    medication: Pill,
    schedule: Calendar,
    system: Users,
    ai: Brain
  };

  const categoryColors = {
    health: 'text-red-600 bg-red-50',
    financial: 'text-green-600 bg-green-50',
    family: 'text-pink-600 bg-pink-50',
    medication: 'text-purple-600 bg-purple-50',
    schedule: 'text-orange-600 bg-orange-50',
    system: 'text-blue-600 bg-blue-50',
    ai: 'text-indigo-600 bg-indigo-50'
  };

  const categoryLabels = {
    health: 'Saúde',
    financial: 'Financeiro',
    family: 'Familiares',
    medication: 'Medicações',
    schedule: 'Escalas',
    system: 'Sistema',
    ai: 'IA'
  };

  if (summary.total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium">Tudo em ordem</span>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-500">Nenhuma notificação pendente</p>
          <p className="text-sm text-gray-400 mt-1">Sistema funcionando normalmente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Alertas e Notificações</h3>
        <div className="flex items-center space-x-2">
          {summary.critical > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 font-medium">{summary.critical} críticas</span>
            </div>
          )}
          <span className="text-sm text-gray-500">{summary.unread} não lidas</span>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalNotifications.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">Alertas Críticos</span>
          </div>
          <div className="space-y-2">
            {criticalNotifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                onClick={() => notification.actionUrl && navigate(notification.actionUrl)}
                className="p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">{notification.title}</p>
                    <p className="text-sm text-red-700 mt-1 line-clamp-2">{notification.message}</p>
                    {notification.residentName && (
                      <p className="text-xs text-red-600 mt-1">Residente: {notification.residentName}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {criticalNotifications.length > 3 && (
              <p className="text-xs text-red-600 text-center">
                +{criticalNotifications.length - 3} alertas críticos adicionais
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warning Alerts */}
      {warningNotifications.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Avisos Importantes</span>
          </div>
          <div className="space-y-2">
            {warningNotifications.slice(0, 2).map((notification) => (
              <div
                key={notification.id}
                onClick={() => notification.actionUrl && navigate(notification.actionUrl)}
                className="p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">{notification.title}</p>
                    <p className="text-sm text-orange-700 mt-1 line-clamp-1">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
            {warningNotifications.length > 2 && (
              <p className="text-xs text-orange-600 text-center">
                +{warningNotifications.length - 2} avisos adicionais
              </p>
            )}
          </div>
        </div>
      )}

      {/* Category Summary */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(summary.byCategory).map(([category, count]) => {
          if (count === 0) return null;
          
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          const colorClass = categoryColors[category as keyof typeof categoryColors];
          const label = categoryLabels[category as keyof typeof categoryLabels];
          
          return (
            <div key={category} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
              <div className={`p-1 rounded ${colorClass}`}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-500">{count} notificações</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
