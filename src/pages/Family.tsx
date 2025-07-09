import React, { useState } from 'react';
import { MessageCircle, Plus, Search, Filter, Eye, AlertTriangle, Clock, User, Phone, Mail, Send, X, TestTube, Users, Calendar, Heart, Star, Reply, UserPlus, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { FamilyMessage, FamilyMember } from '../types';
import { createTestFamilyData } from '../utils/familyTestData';

interface MessageFormData {
  residentId: string;
  familyMemberId: string;
  fromName: string;
  message: string;
  type: 'update' | 'request' | 'emergency' | 'response';
  parentMessageId?: string;
}

interface FamilyMemberFormData {
  name: string;
  phone: string;
  email: string;
  relation: string;
  residentId: string;
  isPrimary: boolean;
  notes: string;
}

const initialMessageFormData: MessageFormData = {
  residentId: '',
  familyMemberId: '',
  fromName: '',
  message: '',
  type: 'update'
};

const initialMemberFormData: FamilyMemberFormData = {
  name: '',
  phone: '',
  email: '',
  relation: '',
  residentId: '',
  isPrimary: false,
  notes: ''
};

const messageTypeColors = {
  update: 'bg-blue-100 text-blue-800 border-blue-200',
  request: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  emergency: 'bg-red-100 text-red-800 border-red-200',
  response: 'bg-green-100 text-green-800 border-green-200'
};

const messageTypeIcons = {
  update: MessageCircle,
  request: Clock,
  emergency: AlertTriangle,
  response: Reply
};

export const Family: React.FC = () => {
  const { 
    residents, 
    familyMessages, 
    familyMembers,
    addFamilyMessage, 
    updateFamilyMessage, 
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    isLoading, 
    refreshData 
  } = useApp();
  const { user } = useAuth();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [messageFormData, setMessageFormData] = useState<MessageFormData>(initialMessageFormData);
  const [memberFormData, setMemberFormData] = useState<FamilyMemberFormData>(initialMemberFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'update' | 'request' | 'emergency' | 'response'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
  const [filterResident, setFilterResident] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewingMessage, setViewingMessage] = useState<FamilyMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<FamilyMessage | null>(null);
  const [creatingTestData, setCreatingTestData] = useState(false);
  const [viewMode, setViewMode] = useState<'messages' | 'families' | 'stats'>('messages');

  const handleCreateTestData = async () => {
    if (!user) {
      alert('Usuário não encontrado. Faça login novamente.');
      return;
    }
    
    setCreatingTestData(true);
    try {
      console.log('Creating test family data for user:', user.id);
      
      const result = await createTestFamilyData(user.id, residents);
      
      console.log('Test family data created, refreshing app data...');
      await refreshData();
      
      alert(`Dados de teste criados com sucesso!\n\n✅ ${result.familyMembers.length} familiares\n✅ ${result.familyMessages.length} mensagens familiares`);
    } catch (error) {
      console.error('Error creating test family data:', error);
      alert(`Erro ao criar dados de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setCreatingTestData(false);
    }
  };

  // Filter messages
  const filteredMessages = familyMessages.filter(message => {
    const resident = residents.find(r => r.id === message.residentId);
    const matchesSearch = (message.from || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (message.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (resident?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || message.type === filterType;
    const matchesRead = filterRead === 'all' || 
                       (filterRead === 'read' && message.read) ||
                       (filterRead === 'unread' && !message.read);
    const matchesResident = filterResident === 'all' || message.residentId === filterResident;
    return matchesSearch && matchesType && matchesRead && matchesResident;
  });

  // Get family statistics
  const getStatistics = () => {
    const totalMessages = familyMessages.length;
    const unreadMessages = familyMessages.filter(m => !m.read).length;
    const emergencyMessages = familyMessages.filter(m => m.type === 'emergency').length;
    const requestMessages = familyMessages.filter(m => m.type === 'request').length;
    
    // Get unique families
    const uniqueFamilies = familyMembers.length;
    
    // Get messages by resident
    const messagesByResident = residents.map(resident => ({
      resident,
      messageCount: familyMessages.filter(m => m.residentId === resident.id).length,
      unreadCount: familyMessages.filter(m => m.residentId === resident.id && !m.read).length,
      familyCount: familyMembers.filter(f => f.residentId === resident.id).length
    })).sort((a, b) => b.messageCount - a.messageCount);

    return {
      totalMessages,
      unreadMessages,
      emergencyMessages,
      requestMessages,
      uniqueFamilies,
      messagesByResident
    };
  };

  const stats = getStatistics();

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMessageFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-fill from name when family member is selected
    if (name === 'familyMemberId' && value) {
      const selectedMember = familyMembers.find(m => m.id === value);
      if (selectedMember) {
        setMessageFormData(prev => ({ ...prev, fromName: selectedMember.name }));
      }
    }
  };

  const handleMemberInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setMemberFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const messageData: Omit<FamilyMessage, 'id' | 'date' | 'read'> = {
        residentId: messageFormData.residentId,
        familyMemberId: messageFormData.familyMemberId || undefined,
        from: messageFormData.fromName,
        message: messageFormData.message,
        type: messageFormData.type,
        parentMessageId: messageFormData.parentMessageId
      };

      await addFamilyMessage(messageData);

      setShowMessageModal(false);
      setReplyingTo(null);
      setMessageFormData(initialMessageFormData);
    } catch (error) {
      console.error('Error saving message:', error);
      alert('Erro ao salvar mensagem. Tente novamente.');
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const memberData: Omit<FamilyMember, 'id'> = {
        name: memberFormData.name,
        phone: memberFormData.phone,
        email: memberFormData.email || undefined,
        relation: memberFormData.relation,
        residentId: memberFormData.residentId,
        isPrimary: memberFormData.isPrimary,
        notes: memberFormData.notes || undefined
      };

      if (editingMember) {
        await updateFamilyMember(editingMember.id, memberData);
      } else {
        await addFamilyMember(memberData);
      }

      setShowMemberModal(false);
      setEditingMember(null);
      setMemberFormData(initialMemberFormData);
    } catch (error) {
      console.error('Error saving family member:', error);
      alert('Erro ao salvar familiar. Tente novamente.');
    }
  };

  const handleReply = (message: FamilyMessage) => {
    setReplyingTo(message);
    setMessageFormData({
      ...initialMessageFormData,
      residentId: message.residentId,
      type: 'response',
      parentMessageId: message.id
    });
    setShowMessageModal(true);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setMemberFormData({
      name: member.name,
      phone: member.phone,
      email: member.email || '',
      relation: member.relation,
      residentId: member.residentId,
      isPrimary: member.isPrimary,
      notes: member.notes || ''
    });
    setShowMemberModal(true);
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteFamilyMember(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting family member:', error);
      alert('Erro ao excluir familiar. Tente novamente.');
    }
  };

  const handleMarkAsRead = async (message: FamilyMessage) => {
    try {
      await updateFamilyMessage(message.id, { read: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
      alert('Erro ao marcar mensagem como lida.');
    }
  };

  const getResidentName = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    return resident ? resident.name : 'Residente não encontrado';
  };

  const getFamilyMembersByResident = (residentId: string) => {
    return familyMembers.filter(m => m.residentId === residentId);
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'update': return 'Atualização';
      case 'request': return 'Solicitação';
      case 'emergency': return 'Emergência';
      case 'response': return 'Resposta';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Group messages by conversation (parent and replies)
  const getMessageThreads = () => {
    const threads: { [key: string]: FamilyMessage[] } = {};
    
    filteredMessages.forEach(message => {
      const threadId = message.parentMessageId || message.id;
      if (!threads[threadId]) {
        threads[threadId] = [];
      }
      threads[threadId].push(message);
    });

    // Sort messages within each thread by date
    Object.keys(threads).forEach(threadId => {
      threads[threadId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return threads;
  };

  const messageThreads = getMessageThreads();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal da Família</h1>
          <p className="text-gray-600">Comunicação e relacionamento com familiares</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('messages')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'messages' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Mensagens
            </button>
            <button
              onClick={() => setViewMode('families')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'families' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Famílias
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'stats' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Estatísticas
            </button>
          </div>
          {familyMessages.length === 0 && familyMembers.length === 0 && (
            <button 
              onClick={handleCreateTestData}
              disabled={creatingTestData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingTestData ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              <span>{creatingTestData ? 'Criando Dados...' : 'Criar Dados de Teste'}</span>
            </button>
          )}
          <button 
            onClick={() => {
              setMessageFormData(initialMessageFormData);
              setReplyingTo(null);
              setShowMessageModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Mensagem</span>
          </button>
          <button 
            onClick={() => {
              setEditingMember(null);
              setMemberFormData(initialMemberFormData);
              setShowMemberModal(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Familiar</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Mensagens</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Não Lidas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
            </div>
            <Mail className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Emergências</p>
              <p className="text-2xl font-bold text-gray-900">{stats.emergencyMessages}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Famílias Cadastradas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueFamilies}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {viewMode === 'messages' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por familiar, mensagem ou residente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Tipos</option>
                <option value="update">Atualização</option>
                <option value="request">Solicitação</option>
                <option value="emergency">Emergência</option>
                <option value="response">Resposta</option>
              </select>
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="unread">Não Lidas</option>
                <option value="read">Lidas</option>
              </select>
              <select
                value={filterResident}
                onChange={(e) => setFilterResident(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Residentes</option>
                {residents.map(resident => (
                  <option key={resident.id} value={resident.id}>
                    {resident.name}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-500">
                {filteredMessages.length} de {familyMessages.length} mensagens
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados...</p>
          </div>
        </div>
      ) : viewMode === 'messages' ? (
        // Messages View
        Object.keys(messageThreads).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(messageThreads).map(([threadId, messages]) => {
              const mainMessage = messages[0];
              const replies = messages.slice(1);
              const TypeIcon = messageTypeIcons[mainMessage.type];
              
              return (
                <div key={threadId} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Main Message */}
                  <div className={`p-6 ${!mainMessage.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-2 rounded-lg ${messageTypeColors[mainMessage.type]}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{mainMessage.from}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${messageTypeColors[mainMessage.type]}`}>
                              {getTypeText(mainMessage.type)}
                            </span>
                            {!mainMessage.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Sobre: {getResidentName(mainMessage.residentId)}
                          </p>
                          <p className="text-gray-700 mb-3">{mainMessage.message}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{formatDate(mainMessage.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!mainMessage.read && (
                          <button
                            onClick={() => handleMarkAsRead(mainMessage)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Marcar como Lida
                          </button>
                        )}
                        <button
                          onClick={() => handleReply(mainMessage)}
                          className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <Reply className="w-3 h-3" />
                          <span>Responder</span>
                        </button>
                        <button
                          onClick={() => setViewingMessage(mainMessage)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          {replies.length} resposta{replies.length !== 1 ? 's' : ''}
                        </h4>
                        <div className="space-y-3">
                          {replies.map((reply) => {
                            const ReplyIcon = messageTypeIcons[reply.type];
                            return (
                              <div key={reply.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start space-x-3">
                                  <div className={`p-1 rounded ${messageTypeColors[reply.type]}`}>
                                    <ReplyIcon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900">{reply.from}</span>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${messageTypeColors[reply.type]}`}>
                                        {getTypeText(reply.type)}
                                      </span>
                                      {!reply.read && (
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{reply.message}</p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center text-xs text-gray-500">
                                        <Clock className="w-3 h-3 mr-1" />
                                        <span>{formatDate(reply.date)}</span>
                                      </div>
                                      {!reply.read && (
                                        <button
                                          onClick={() => handleMarkAsRead(reply)}
                                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                        >
                                          Marcar como Lida
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterType !== 'all' || filterRead !== 'all' || filterResident !== 'all' 
                  ? 'Nenhuma mensagem encontrada' 
                  : 'Nenhuma mensagem cadastrada'
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterType !== 'all' || filterRead !== 'all' || filterResident !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece adicionando a primeira mensagem ao sistema ou crie dados de teste.'
                }
              </p>
              {!searchTerm && filterType === 'all' && filterRead === 'all' && filterResident === 'all' && (
                <div className="flex items-center justify-center space-x-4">
                  <button 
                    onClick={handleCreateTestData}
                    disabled={creatingTestData}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingTestData ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    <span>{creatingTestData ? 'Criando Dados...' : 'Criar Dados de Teste'}</span>
                  </button>
                  <button 
                    onClick={() => {
                      setMessageFormData(initialMessageFormData);
                      setReplyingTo(null);
                      setShowMessageModal(true);
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Primeira Mensagem</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      ) : viewMode === 'families' ? (
        // Families View
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Famílias por Residente</h3>
                <p className="text-sm text-gray-500">Gerenciar familiares cadastrados</p>
              </div>
              <button 
                onClick={() => {
                  setEditingMember(null);
                  setMemberFormData(initialMemberFormData);
                  setShowMemberModal(true);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Familiar</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            {stats.messagesByResident.length > 0 ? (
              <div className="space-y-6">
                {stats.messagesByResident.map(({ resident, messageCount, unreadCount, familyCount }) => {
                  const residentFamilyMembers = getFamilyMembersByResident(resident.id);
                  
                  return (
                    <div key={resident.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{resident.name}</h4>
                          <p className="text-sm text-gray-500">Quarto {resident.room}</p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{messageCount}</div>
                            <div className="text-gray-500">Mensagens</div>
                          </div>
                          {unreadCount > 0 && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-600">{unreadCount}</div>
                              <div className="text-gray-500">Não Lidas</div>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{familyCount}</div>
                            <div className="text-gray-500">Familiares</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Family Members */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">Familiares Cadastrados:</h5>
                          <button
                            onClick={() => {
                              setEditingMember(null);
                              setMemberFormData({ ...initialMemberFormData, residentId: resident.id });
                              setShowMemberModal(true);
                            }}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                          >
                            + Adicionar Familiar
                          </button>
                        </div>
                        {residentFamilyMembers.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {residentFamilyMembers.map(familyMember => (
                              <div key={familyMember.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-3 flex-1">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                      <User className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <h6 className="font-medium text-gray-900">{familyMember.name}</h6>
                                        {familyMember.isPrimary && (
                                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                            Principal
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600">{familyMember.relation}</p>
                                      <p className="text-xs text-gray-500">{familyMember.phone}</p>
                                      {familyMember.email && (
                                        <p className="text-xs text-gray-500">{familyMember.email}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleEditMember(familyMember)}
                                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setShowDeleteConfirm(familyMember.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                {familyMember.notes && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-xs text-gray-600">{familyMember.notes}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 border border-gray-200 rounded-lg bg-gray-50">
                            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">Nenhum familiar cadastrado</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Emergency Contact Info */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-2">Contato de Emergência (Cadastro do Residente):</h5>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{resident.emergencyContact.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{resident.emergencyContact.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{resident.emergencyContact.relation}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum residente cadastrado ainda.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Statistics View
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Types Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Mensagem</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">Atualizações</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {familyMessages.filter(m => m.type === 'update').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">Solicitações</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {familyMessages.filter(m => m.type === 'request').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">Emergências</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {familyMessages.filter(m => m.type === 'emergency').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">Respostas</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {familyMessages.filter(m => m.type === 'response').length}
                </span>
              </div>
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status de Leitura</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">Mensagens Lidas</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {familyMessages.filter(m => m.read).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">Mensagens Não Lidas</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {familyMessages.filter(m => !m.read).length}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Taxa de Leitura</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {familyMessages.length > 0 
                      ? Math.round((familyMessages.filter(m => m.read).length / familyMessages.length) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Most Active Families */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Famílias Mais Ativas</h3>
            {familyMessages.length > 0 ? (
              <div className="space-y-3">
                {Object.entries(
                  familyMessages.reduce((acc, message) => {
                    if (message.from) {
                      acc[message.from] = (acc[message.from] || 0) + 1;
                    }
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([familyMember, count], index) => (
                    <div key={familyMember} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-900">{familyMember}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{count} mensagens</span>
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nenhuma atividade familiar registrada ainda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {replyingTo ? `Responder à ${replyingTo.from}` : 'Nova Mensagem'}
              </h2>
              {replyingTo && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Respondendo a:</p>
                  <p className="text-sm text-gray-800 italic">"{replyingTo.message.substring(0, 100)}..."</p>
                </div>
              )}
            </div>
            
            <form onSubmit={handleMessageSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Residente *
                  </label>
                  <select
                    name="residentId"
                    value={messageFormData.residentId}
                    onChange={handleMessageInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um residente</option>
                    {residents.map(resident => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name} - Quarto {resident.room}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Familiar (opcional)
                  </label>
                  <select
                    name="familyMemberId"
                    value={messageFormData.familyMemberId}
                    onChange={handleMessageInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um familiar</option>
                    {familyMembers
                      .filter(member => !messageFormData.residentId || member.residentId === messageFormData.residentId)
                      .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.relation})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Remetente *
                </label>
                <input
                  type="text"
                  name="fromName"
                  value={messageFormData.fromName}
                  onChange={handleMessageInputChange}
                  required
                  placeholder="Nome completo do familiar ou remetente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Mensagem *
                </label>
                <select
                  name="type"
                  value={messageFormData.type}
                  onChange={handleMessageInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="update">Atualização</option>
                  <option value="request">Solicitação</option>
                  <option value="emergency">Emergência</option>
                  <option value="response">Resposta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem *
                </label>
                <textarea
                  name="message"
                  value={messageFormData.message}
                  onChange={handleMessageInputChange}
                  required
                  rows={6}
                  placeholder="Digite a mensagem..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageModal(false);
                    setReplyingTo(null);
                    setMessageFormData(initialMessageFormData);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{replyingTo ? 'Enviar Resposta' : 'Adicionar Mensagem'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Family Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMember ? 'Editar Familiar' : 'Novo Familiar'}
              </h2>
            </div>
            
            <form onSubmit={handleMemberSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={memberFormData.name}
                    onChange={handleMemberInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={memberFormData.phone}
                    onChange={handleMemberInputChange}
                    required
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={memberFormData.email}
                    onChange={handleMemberInputChange}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parentesco *
                  </label>
                  <input
                    type="text"
                    name="relation"
                    value={memberFormData.relation}
                    onChange={handleMemberInputChange}
                    required
                    placeholder="Ex: Filho(a), Cônjuge, Irmão(ã)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Residente *
                  </label>
                  <select
                    name="residentId"
                    value={memberFormData.residentId}
                    onChange={handleMemberInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um residente</option>
                    {residents.map(resident => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name} - Quarto {resident.room}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isPrimary"
                      checked={memberFormData.isPrimary}
                      onChange={handleMemberInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Contato Principal</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={memberFormData.notes}
                  onChange={handleMemberInputChange}
                  rows={3}
                  placeholder="Informações adicionais sobre o familiar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowMemberModal(false);
                    setEditingMember(null);
                    setMemberFormData(initialMemberFormData);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{editingMember ? 'Salvar Alterações' : 'Adicionar Familiar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Detalhes da Mensagem</h2>
                <button
                  onClick={() => setViewingMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{viewingMessage.from}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${messageTypeColors[viewingMessage.type]}`}>
                      {getTypeText(viewingMessage.type)}
                    </span>
                    {!viewingMessage.read && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Não Lida
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Residente:</span>
                    <span className="ml-2 text-gray-900">{getResidentName(viewingMessage.residentId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Data:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(viewingMessage.date).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Mensagem</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingMessage.message}</p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                {!viewingMessage.read && (
                  <button
                    onClick={() => {
                      handleMarkAsRead(viewingMessage);
                      setViewingMessage(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Marcar como Lida
                  </button>
                )}
                <button
                  onClick={() => {
                    handleReply(viewingMessage);
                    setViewingMessage(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Reply className="w-4 h-4" />
                  <span>Responder</span>
                </button>
                <button
                  onClick={() => setViewingMessage(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir este familiar? Esta ação não pode ser desfeita.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteMember(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
