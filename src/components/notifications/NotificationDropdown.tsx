import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  Heart,
  DollarSign,
  MessageCircle,
  Pill,
  Calendar,
  Settings,
  Brain,
  PhoneCall,
  CheckSquare
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationDropdown: React.FC = () => {
  const { 
    notifications, 
    summary, 
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    clearAllNotifications,
    markAsFamilyNotified,
    markAsResolved
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'critical':
        return notification.type === 'critical';
      default:
        return true;
    }
  });

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'health': return Heart;
      case 'financial': return DollarSign;
      case 'family': return MessageCircle;
      case 'medication': return Pill;
      case 'schedule': return Calendar;
      case 'system': return Settings;
      case 'ai': return Brain;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'warning': return AlertCircle;
      case 'success': return Check;
      default: return Info;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {summary.unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {summary.unread > 99 ? '99+' : summary.unread}
          </span>
        )}
        {summary.critical > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Summary */}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>{summary.total} total • {summary.unread} não lidas</span>
                {summary.critical > 0 && (
                  <span className="text-red-600 font-medium">
                    {summary.critical} críticas
                  </span>
                )}
              </div>

              {/* Filters */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === 'all' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === 'unread' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Não Lidas ({summary.unread})
                </button>
                <button
                  onClick={() => setFilter('critical')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === 'critical' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Críticas ({summary.critical})
                </button>
              </div>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Marcar todas como lidas</span>
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar todas</span>
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => {
                    const CategoryIcon = getNotificationIcon(notification.category);
                    const TypeIcon = getTypeIcon(notification.type);
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon */}
                          <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className={`text-sm font-medium ${
                                    !notification.read ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <TypeIcon className={`w-3 h-3 ${
                                    notification.type === 'critical' ? 'text-red-500' :
                                    notification.type === 'warning' ? 'text-orange-500' :
                                    'text-blue-500'
                                  }`} />
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {format(parseISO(notification.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </p>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center space-x-1 ml-2">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                    title="Marcar como lida"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                                {!notification.familyNotified && notification.residentId && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsFamilyNotified(notification.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-purple-600 rounded"
                                    title="Marcar família como notificada"
                                  >
                                    <PhoneCall className="w-3 h-3" />
                                  </button>
                                )}
                                {!notification.resolved && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsResolved(notification.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                                    title="Marcar como resolvido"
                                  >
                                    <CheckSquare className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clearNotification(notification.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                                  title="Remover notificação"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Status indicators */}
                            <div className="flex items-center space-x-2 mt-2">
                              {notification.familyNotified && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  <PhoneCall className="w-3 h-3 mr-1" />
                                  Família notificada
                                </span>
                              )}
                              {notification.resolved && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  <CheckSquare className="w-3 h-3 mr-1" />
                                  Resolvido
                                </span>
                              )}
                            </div>
                            
                            {/* Resident info */}
                            {notification.residentName && (
                              <div className="mt-2 text-xs text-gray-500">
                                Residente: {notification.residentName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {filter === 'all' 
                      ? 'Nenhuma notificação' 
                      : filter === 'unread'
                      ? 'Nenhuma notificação não lida'
                      : 'Nenhuma notificação crítica'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-500 text-center">
                  As notificações são atualizadas automaticamente
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
