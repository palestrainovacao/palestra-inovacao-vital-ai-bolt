import React, { useState } from 'react';
import { Users, Plus, Search, Filter, Edit, Trash2, Eye, AlertTriangle, Calendar, MapPin, X, TestTube, RefreshCw, Stethoscope, Activity } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Resident } from '../types';
import { createCompleteTestData } from '../utils/testData';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Residents: React.FC = () => {
  const { 
    residents, 
    deleteResident, 
    isLoading, 
    refreshData, 
    migrateResidentsToOrganization,
    hasResidentsWithoutOrganization
  } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'stable' | 'attention' | 'critical'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [creatingTestData, setCreatingTestData] = useState(false);
  const [migratingData, setMigratingData] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success?: boolean;
    count?: number;
    error?: string;
    message?: string;
  } | null>(null);

  // Filter residents based on search and status
  const filteredResidents = residents.filter(resident => {
    const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resident.room.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || resident.healthStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTestData = async () => {
    if (!user) {
      alert('Usuário não encontrado. Faça login novamente.');
      return;
    }
    
    setCreatingTestData(true);
    try {
      console.log('Creating test data for user:', user.id);
      
      const result = await createCompleteTestData(user.id);
      
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

  const handleMigrateResidents = async () => {
    if (!user || !user.organizationId) {
      setMigrationResult({
        success: false,
        error: 'Usuário não está associado a uma organização'
      });
      return;
    }

    setMigratingData(true);
    setMigrationResult(null);

    try {
      const result = await migrateResidentsToOrganization();
      
      if (result.success) {
        setMigrationResult({
          success: true,
          count: result.count,
          message: `${result.count} residentes foram migrados com sucesso para a organização atual.`
        });
        
        // Refresh data to show the updated residents
        await refreshData();
      } else {
        setMigrationResult({
          success: false,
          error: result.error || 'Erro desconhecido durante a migração'
        });
      }
    } catch (error) {
      console.error('Error migrating residents:', error);
      setMigrationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido durante a migração'
      });
    } finally {
      setMigratingData(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResident(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting resident:', error);
      alert('Erro ao excluir residente. Tente novamente.');
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'bg-green-100 text-green-800';
      case 'attention': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case 'stable': return 'Estável';
      case 'attention': return 'Atenção';
      case 'critical': return 'Crítico';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residentes</h1>
          <p className="text-gray-600">Gerenciar informações dos residentes</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {hasResidentsWithoutOrganization && user?.organizationId && (
            <button 
              onClick={handleMigrateResidents}
              disabled={migratingData}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {migratingData ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{migratingData ? 'Migrando...' : 'Migrar Residentes'}</span>
            </button>
          )}
          {residents.length === 0 && (
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
            onClick={() => navigate('/residents/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Residente</span>
          </button>
        </div>
      </div>

      {/* Migration Result Message */}
      {migrationResult && (
        <div className={`p-4 rounded-lg ${
          migrationResult.success 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {migrationResult.success ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{migrationResult.message || `${migrationResult.count} residentes migrados com sucesso.`}</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{migrationResult.error || 'Erro ao migrar residentes.'}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou quarto..."
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
              <option value="stable">Estável</option>
              <option value="attention">Atenção</option>
              <option value="critical">Crítico</option>
            </select>
            <div className="text-sm text-gray-500">
              {filteredResidents.length} de {residents.length} residentes
            </div>
          </div>
        </div>
      </div>

      {/* Residents Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando residentes...</p>
          </div>
        </div>
      ) : filteredResidents.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quarto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admissão
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observações
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResidents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{resident.name}</div>
                          <div className="text-sm text-gray-500">{resident.gender === 'M' ? 'Masculino' : 'Feminino'}, {resident.age} anos</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{resident.room}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(parseISO(resident.admissionDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getHealthStatusColor(resident.healthStatus)}`}>
                        {getHealthStatusText(resident.healthStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2">
                        {resident.notes || "Sem observações"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/residents/view/${resident.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/residents/edit/${resident.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(resident.id)}
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
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Nenhum residente encontrado' : 'Nenhum residente cadastrado'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece adicionando o primeiro residente ao sistema ou crie dados de teste.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
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
                  onClick={() => navigate('/residents/new')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Primeiro Residente</span>
                </button>
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
                Tem certeza que deseja excluir este residente? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
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
