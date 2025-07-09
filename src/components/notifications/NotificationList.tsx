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
  CheckSquare,
  Filter,
  Search,
  Download,
  ArrowDownUp
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationList: React.FC = () => {
  const { 
    notifications, 
    markAsRead, 
    clearNotification, 
    markAsFamilyNotified,
    markAsResolved
  } = useNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter(notification => {
      // Search filter
      const matchesSearch = 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notification.residentName && notification.residentName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Category filter
      const matchesCategory = filterCategory === 'all' || notification.category === filterCategory;
      
      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'unread') matchesStatus = !notification.read;
      else if (filterStatus === 'family_notified') matchesStatus = !!notification.familyNotified;
      else if (filterStatus === 'resolved') matchesStatus = !!notification.resolved;
      else if (filterStatus === 'pending') matchesStatus = !notification.resolved;
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityOrder[a.priority];
        const priorityB = priorityOrder[b.priority];
        return sortDirection === 'desc' ? priorityB - priorityA : priorityA - priorityB;
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'health': return 'Saúde';
      case 'financial': return 'Financeiro';
      case 'family': return 'Familiares';
      case 'medication': return 'Medicações';
      case 'schedule': return 'Escalas';
      case 'system': return 'Sistema';
      case 'ai': return 'IA';
      default: return category;
    }
  };

  const toggleSort = (field: 'date' | 'priority') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    // Prepare data for CSV
    const headers = ['Data', 'Categoria', 'Tipo', 'Título', 'Mensagem', 'Residente', 'Lida', 'Família Notificada', 'Resolvida'];
    
    const rows = filteredNotifications.map(n => [
      format(parseISO(n.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      getCategoryLabel(n.category),
      n.type === 'critical' ? 'Crítico' : n.type === 'warning' ? 'Alerta' : n.type === 'info' ? 'Informação' : 'Sucesso',
      n.title,
      n.message,
      n.residentName || '-',
      n.read ? 'Sim' : 'Não',
      n.familyNotified ? 'Sim' : 'Não',
      n.resolved ? 'Sim' : 'Não'
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n')) 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `notificacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Categorias</option>
              <option value="health">Saúde</option>
              <option value="financial">Financeiro</option>
              <option value="family">Familiares</option>
              <option value="medication">Medicações</option>
              <option value="schedule">Escalas</option>
              <option value="system">Sistema</option>
              <option value="ai">IA</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="unread">Não Lidas</option>
              <option value="family_notified">Família Notificada</option>
              <option value="resolved">Resolvidas</option>
              <option value="pending">Pendentes</option>
            </select>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
            <div className="text-sm text-gray-500">
              {filteredNotifications.length} notificações encontradas
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1 cursor-pointer" onClick={() => toggleSort('date')}>
                    <span>Data</span>
                    <ArrowDownUp className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1 cursor-pointer" onClick={() => toggleSort('priority')}>
                    <span>Prioridade</span>
                    <ArrowDownUp className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Residente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => {
                  const CategoryIcon = getNotificationIcon(notification.category);
                  const TypeIcon = getTypeIcon(notification.type);
                  
                  return (
                    <tr key={notification.id} className={!notification.read ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(notification.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-2 ${getNotificationColor(notification.type)}`}>
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm text-gray-900">{getCategoryLabel(notification.category)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                          notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {notification.priority === 'high' ? 'Alta' :
                           notification.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TypeIcon className={`w-4 h-4 mr-2 ${
                            notification.type === 'critical' ? 'text-red-500' :
                            notification.type === 'warning' ? 'text-orange-500' :
                            notification.type === 'success' ? 'text-green-500' :
                            'text-blue-500'
                          }`} />
                          <span className="text-sm font-medium text-gray-900">{notification.title}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{notification.message}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {notification.residentName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {!notification.read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Não lida
                            </span>
                          )}
                          {notification.familyNotified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <PhoneCall className="w-3 h-3 mr-1" />
                              Família notificada
                            </span>
                          )}
                          {notification.resolved && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <CheckSquare className="w-3 h-3 mr-1" />
                              Resolvida
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Marcar como lida"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {!notification.familyNotified && notification.residentId && (
                            <button
                              onClick={() => markAsFamilyNotified(notification.id)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Marcar família como notificada"
                            >
                              <PhoneCall className="w-4 h-4" />
                            </button>
                          )}
                          {!notification.resolved && (
                            <button
                              onClick={() => markAsResolved(notification.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Marcar como resolvido"
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => clearNotification(notification.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Remover notificação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma notificação encontrada</p>
                    <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
