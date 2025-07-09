import React, { useState } from 'react';
import { 
  Footprints, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  DollarSign,
  X,
  TestTube,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { DiaperUsageFilterControls } from '../components/diaperUsage/DiaperUsageFilterControls';

export default function DiaperUsage() {
  const { 
    residents, 
    diaperUsages, 
    diaperTypes, 
    deleteDiaperUsage,
    deleteDiaperType,
    isLoading,
    refreshData,
    connectionError
  } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'usage' | 'types'>('usage');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResident, setFilterResident] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'7' | '30' | '90' | 'all'>('30');
  const [filterDate, setFilterDate] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [creatingTestData, setCreatingTestData] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'resident' | 'quantity' | 'shift'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  const [tooltipContent, setTooltipContent] = useState<{id: string, content: string} | null>(null);

  const handleCreateTestData = async () => {
    if (!user) {
      alert('Usuário não encontrado. Faça login novamente.');
      return;
    }
    
    if (residents.length === 0) {
      alert('Nenhum residente encontrado. Crie residentes primeiro.');
      return;
    }
    
    setCreatingTestData(true);
    try {
      // Create test diaper usage data for last 30 days
      const testData = [];
      const currentDate = new Date();
      
      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const recordDate = new Date(currentDate);
        recordDate.setDate(currentDate.getDate() - dayOffset);
        const dateStr = recordDate.toISOString().split('T')[0];
        
        residents.forEach(resident => {
          // 2-4 diaper changes per day per resident
          const changesPerDay = Math.floor(Math.random() * 3) + 2;
          
          for (let i = 0; i < changesPerDay; i++) {
            const shifts = ['morning', 'afternoon', 'night'];
            const shift = shifts[i % 3];
            const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 diapers per change
            
            testData.push({
              residentId: resident.id,
              date: dateStr,
              quantity,
              shift,
              observations: Math.random() > 0.8 ? 'Troca de rotina' : undefined
            });
          }
        });
      }
      
      // Add test data
      for (const usage of testData) {
        await addDiaperUsage(usage);
      }
      
      alert(`Dados de teste criados com sucesso!\n\n✅ ${testData.length} registros de uso de fraldas`);
    } catch (error) {
      console.error('Error creating test diaper usage data:', error);
      alert(`Erro ao criar dados de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setCreatingTestData(false);
    }
  };

  const handleDeleteDiaperUsage = async (id: string) => {
    try {
      await deleteDiaperUsage(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting diaper usage:', error);
      alert('Erro ao excluir registro de uso de fralda. Tente novamente.');
    }
  };

  const handleDeleteDiaperType = async (id: string) => {
    try {
      await deleteDiaperType(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting diaper type:', error);
      alert('Erro ao excluir tipo de fralda. Tente novamente.');
    }
  };

  // Filter, sort and paginate data
  const filterAndSortData = (data: any[]) => {
    return data.filter(item => {
      const resident = residents.find(r => r.id === item.residentId);
      const matchesSearch = resident?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesResident = filterResident === 'all' || item.residentId === filterResident;
      const matchesShift = filterShift === 'all' || item.shift === filterShift;
      const matchesDate = !filterDate || item.date === filterDate;
      
      let matchesPeriod = true;
      if (filterPeriod !== 'all' && !filterDate) {
        const days = parseInt(filterPeriod);
        const cutoffDate = subDays(new Date(), days);
        const itemDate = parseISO(item.date);
        matchesPeriod = isAfter(itemDate, cutoffDate);
      }
      
      return matchesSearch && matchesResident && matchesShift && matchesPeriod && matchesDate;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      } else if (sortBy === 'resident') {
        const residentA = residents.find(r => r.id === a.residentId)?.name || '';
        const residentB = residents.find(r => r.id === b.residentId)?.name || '';
        return sortDirection === 'desc' 
          ? residentB.localeCompare(residentA) 
          : residentA.localeCompare(residentB);
      } else if (sortBy === 'quantity') {
        return sortDirection === 'desc' ? b.quantity - a.quantity : a.quantity - b.quantity;
      } else if (sortBy === 'shift') {
        const shiftOrder = { morning: 1, afternoon: 2, night: 3 };
        const shiftA = shiftOrder[a.shift as keyof typeof shiftOrder];
        const shiftB = shiftOrder[b.shift as keyof typeof shiftOrder];
        return sortDirection === 'desc' ? shiftB - shiftA : shiftA - shiftB;
      }
      return 0;
    });
  };

  const filteredUsages = filterAndSortData(diaperUsages);
  
  // Pagination
  const totalPages = Math.ceil(filteredUsages.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredUsages.slice(indexOfFirstRecord, indexOfLastRecord);

  const getResidentName = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    return resident ? resident.name : 'Residente não encontrado';
  };

  const getShiftText = (shift: string) => {
    const shifts = {
      morning: 'Manhã',
      afternoon: 'Tarde',
      night: 'Noite'
    };
    return shifts[shift as keyof typeof shifts] || shift;
  };

  const getShiftColor = (shift: string) => {
    const colors = {
      morning: 'bg-yellow-100 text-yellow-800',
      afternoon: 'bg-blue-100 text-blue-800',
      night: 'bg-purple-100 text-purple-800'
    };
    return colors[shift as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterResident, filterShift, filterPeriod, filterDate, sortBy, sortDirection]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Fraldas</h1>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Show connection error if present
  if (connectionError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Fraldas</h1>
          <p className="text-gray-600">Gerenciamento de uso de fraldas</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium">Erro de conexão</h3>
              <p>{connectionError}</p>
              <button 
                onClick={() => refreshData()}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Fraldas</h1>
          <p className="text-gray-600">Monitoramento do uso de fraldas por residente</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {diaperUsages.length === 0 && (
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
            onClick={() => navigate('/diaper-usage/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('usage')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'usage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Footprints className="w-4 h-4" />
                <span>Registros de Uso ({filteredUsages.length})</span>
              </div>
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('types')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'types'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Tipos de Fraldas ({diaperTypes.length})</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Filters */}
        {activeTab === 'usage' && (
          <div className="p-6 border-b border-gray-200">
            <DiaperUsageFilterControls
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterResident={filterResident}
              setFilterResident={setFilterResident}
              filterShift={filterShift}
              setFilterShift={setFilterShift}
              filterPeriod={filterPeriod}
              setFilterPeriod={setFilterPeriod}
              filterDate={filterDate}
              setFilterDate={setFilterDate}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
              recordsPerPage={recordsPerPage}
              setRecordsPerPage={setRecordsPerPage}
              residents={residents}
              showSortControls={true}
              showPaginationControls={true}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === 'usage' && (
            <div className="space-y-6">
              {currentRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Residente
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Turno
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de Fralda
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
                      {currentRecords.map((usage) => (
                        <tr key={usage.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(parseISO(usage.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getResidentName(usage.residentId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {usage.quantity} {usage.quantity === 1 ? 'fralda' : 'fraldas'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getShiftColor(usage.shift)}`}>
                              {getShiftText(usage.shift)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {usage.diaperTypeId ? (
                              diaperTypes.find(t => t.id === usage.diaperTypeId)?.name || 'Tipo não encontrado'
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 relative">
                            {usage.observations ? (
                              <div className="flex items-center">
                                <div className="max-w-xs truncate">{usage.observations}</div>
                                <button
                                  className="ml-1 text-gray-400 hover:text-gray-600"
                                  onMouseEnter={() => setTooltipContent({ id: usage.id, content: usage.observations })}
                                  onMouseLeave={() => setTooltipContent(null)}
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                                {tooltipContent?.id === usage.id && (
                                  <div className="absolute z-10 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs whitespace-normal left-0 top-10">
                                    {tooltipContent.content}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => navigate(`/diaper-usage/edit/${usage.id}`)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(usage.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <div className="text-center py-8">
                  <Footprints className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum registro de uso encontrado</p>
                  {(searchTerm || filterResident !== 'all' || filterShift !== 'all' || filterPeriod !== 'all' || filterDate) && (
                    <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
                  )}
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Mostrando {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, filteredUsages.length)} de {filteredUsages.length} registros
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={i}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4 rotate-90" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'types' && user?.role === 'admin' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button 
                  onClick={() => navigate('/diaper-types/new')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Tipo</span>
                </button>
              </div>
              
              {diaperTypes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {diaperTypes.map((type) => (
                    <div key={type.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{type.name}</h4>
                          <p className="text-sm text-gray-500">{type.brand} - {type.size}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          type.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {type.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <div className="text-lg font-bold text-blue-600 mb-3">
                        R$ {type.unitCost.toFixed(2)}
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => navigate(`/diaper-types/edit/${type.id}`)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(type.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum tipo de fralda cadastrado</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {diaperUsages.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Footprints className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum registro de uso encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              Comece criando dados de teste ou adicione os primeiros registros de uso de fraldas.
            </p>
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
                onClick={() => navigate('/diaper-usage/new')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Registro</span>
              </button>
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
                Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Check if it's a diaper usage or diaper type
                    if (diaperUsages.some(u => u.id === showDeleteConfirm)) {
                      handleDeleteDiaperUsage(showDeleteConfirm);
                    } else if (diaperTypes.some(t => t.id === showDeleteConfirm)) {
                      handleDeleteDiaperType(showDeleteConfirm);
                    }
                  }}
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
}
