import React, { useState } from 'react';
import { Pill, Plus, Search, Filter, Edit, Trash2, Eye, AlertTriangle, Clock, User, Calendar, TestTube } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Medication } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createCompleteTestData } from '../utils/testData';

export const Medications: React.FC = () => {
  const { residents, medications, deleteMedication, isLoading, refreshData } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [filterResident, setFilterResident] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'schedule'>('list');
  const [creatingTestData, setCreatingTestData] = useState(false);

  // Filter medications based on search, status, and resident
  const filteredMedications = medications.filter(medication => {
    const resident = residents.find(r => r.id === medication.residentId);
    const matchesSearch = medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medication.prescribedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resident?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || medication.status === filterStatus;
    const matchesResident = !filterResident || medication.residentId === filterResident;
    return matchesSearch && matchesStatus && matchesResident;
  });

  const handleCreateTestData = async () => {
    if (!user) {
      alert('Usuário não encontrado. Faça login novamente.');
      return;
    }
    
    setCreatingTestData(true);
    try {
      console.log('Creating test data for user:', user.id);
      
      const result = await createCompleteTestData(user.id, user.organizationId);
      
      console.log('Test data created, refreshing app data...');
      await refreshData();
      
      alert(`Dados de teste criados com sucesso!\n\n✅ ${result.residents.length} residentes\n✅ ${result.medications.length} medicações\n✅ ${result.familyMessages.length} mensagens familiares`);
    } catch (error) {
      console.error('Error creating test data:', error);
      alert(`Erro ao criar dados de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setCreatingTestData(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMedication(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting medication:', error);
      alert('Erro ao excluir medicação. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'paused': return 'Pausado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  const getResidentName = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    return resident ? resident.name : 'Residente não encontrado';
  };

  // Calculate frequency based on time slots
  const calculateFrequency = (timeSlots: string[]) => {
    const count = timeSlots.length;
    if (count === 1) return '1x ao dia';
    if (count === 2) return '2x ao dia';
    if (count === 3) return '3x ao dia';
    if (count === 4) return '4x ao dia';
    return `${count}x ao dia`;
  };

  // Group medications by resident for schedule view
  const medicationsByResident = filteredMedications.reduce((acc, medication) => {
    if (!acc[medication.residentId]) {
      acc[medication.residentId] = {
        residentName: getResidentName(medication.residentId),
        medicationsByTime: {}
      };
    }
    
    medication.time.forEach(time => {
      if (!acc[medication.residentId].medicationsByTime[time]) {
        acc[medication.residentId].medicationsByTime[time] = [];
      }
      acc[medication.residentId].medicationsByTime[time].push(medication);
    });
    
    return acc;
  }, {} as Record<string, { residentName: string, medicationsByTime: Record<string, Medication[]> }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicamentos</h1>
          <p className="text-gray-600">Controle de medicações e tratamentos</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'schedule' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Horários
            </button>
          </div>
          {medications.length === 0 && (
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
            onClick={() => navigate('/medications/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Medicação</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por medicamento, médico ou residente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="completed">Concluído</option>
            </select>
            <select
              value={filterResident}
              onChange={(e) => setFilterResident(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um Residente</option>
              {residents.map(resident => (
                <option key={resident.id} value={resident.id}>
                  {resident.name}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-500">
              {filteredMedications.length} de {medications.length} medicações
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando medicações...</p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        // List View as Table
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredMedications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Residente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicamento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horários
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Data de Início
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMedications.map((medication) => (
                    <tr key={medication.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{getResidentName(medication.residentId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{medication.name}</div>
                            <div className="text-sm text-gray-500">{medication.dosage}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex flex-wrap gap-1 mb-1">
                            {medication.time.map((time, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {time}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {calculateFrequency(medication.time)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(medication.status)}`}>
                          {getStatusText(medication.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(medication.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/medications/view/${medication.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/medications/edit/${medication.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(medication.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' || filterResident !== '' 
                  ? 'Nenhuma medicação encontrada' 
                  : 'Nenhuma medicação cadastrada'
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterStatus !== 'all' || filterResident !== ''
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece adicionando a primeira medicação ao sistema ou crie dados de teste.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && filterResident === '' && (
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
                    onClick={() => navigate('/medications/new')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Primeira Medicação</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Schedule View - Grouped by Resident first, then by time
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Cronograma de Medicações</h3>
            <p className="text-sm text-gray-500">Medicações organizadas por residente e horário</p>
          </div>
          <div className="p-6">
            {Object.keys(medicationsByResident).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(medicationsByResident).map(([residentId, data]) => (
                  <div key={residentId} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{data.residentName}</h4>
                    
                    <div className="space-y-6">
                      {Object.entries(data.medicationsByTime)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([time, meds]) => (
                          <div key={`${residentId}-${time}`} className="ml-4">
                            <h5 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-blue-500" />
                              {time}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {meds.map((medication) => (
                                <div 
                                  key={`${medication.id}-${time}`} 
                                  className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => navigate(`/medications/view/${medication.id}`)}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-medium text-gray-900">{medication.name}</h5>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(medication.status)}`}>
                                      {getStatusText(medication.status)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">{medication.dosage}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma medicação programada para os filtros selecionados.</p>
              </div>
            )}
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
                Tem certeza que deseja excluir esta medicação? Esta ação não pode ser desfeita.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
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
