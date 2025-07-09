import React, { useState } from 'react';
import { 
  Heart, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  Activity, 
  Droplets,
  TestTube,
  X,
  Calendar,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { createTestHealthData } from '../utils/healthTestData';
import { format, parseISO, isAfter, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { HealthRecordsFilterControls } from '../components/healthRecords/HealthRecordsFilterControls';

export const HealthRecords: React.FC = () => {
  const { 
    vitalSigns, 
    eliminationRecords, 
    intercurrences, 
    deleteVitalSigns,
    deleteEliminationRecord,
    deleteIntercurrence,
    isLoading,
    refreshData,
    connectionError
  } = useHealth();
  const { residents } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'vital-signs' | 'elimination' | 'intercurrences'>('vital-signs');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResident, setFilterResident] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'7' | '30' | '90' | 'all'>('30');
  const [filterDate, setFilterDate] = useState<string>('');
  const [creatingTestData, setCreatingTestData] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{id: string, type: string} | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'resident' | 'type' | 'severity'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  const [tooltipContent, setTooltipContent] = useState<{id: string, content: string} | null>(null);

  // Helper functions - moved before their usage
  const getResidentName = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    return resident ? resident.name : 'Residente não encontrado';
  };

  const getVitalSignsStatus = (signs: any) => {
    const alerts = [];
    
    if (signs.systolicPressure && (signs.systolicPressure > 180 || signs.systolicPressure < 90)) {
      alerts.push('Pressão');
    }
    if (signs.oxygenSaturation && signs.oxygenSaturation < 90) {
      alerts.push('Saturação');
    }
    if (signs.temperature && (signs.temperature > 37.5 || signs.temperature < 35.5)) {
      alerts.push('Temperatura');
    }
    if (signs.heartRate && (signs.heartRate > 100 || signs.heartRate < 60)) {
      alerts.push('FC');
    }
    if (signs.glucose && signs.glucose > 200) {
      alerts.push('Glicose');
    }
    
    return alerts.length > 0 ? 'abnormal' : 'normal';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fainting': return 'bg-red-50 border-red-200';
      case 'vomiting': return 'bg-yellow-50 border-yellow-200';
      case 'fall': return 'bg-orange-50 border-orange-200';
      case 'seizure': return 'bg-purple-50 border-purple-200';
      case 'pain': return 'bg-pink-50 border-pink-200';
      case 'breathing_difficulty': return 'bg-red-50 border-red-200';
      case 'skin_injury': return 'bg-blue-50 border-blue-200';
      case 'behavioral_change': return 'bg-indigo-50 border-indigo-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTypeText = (type: string) => {
    const types = {
      fainting: 'Desmaio',
      vomiting: 'Vômito',
      fall: 'Queda',
      seizure: 'Convulsão',
      pain: 'Dor',
      breathing_difficulty: 'Dificuldade Respiratória',
      skin_injury: 'Lesão de Pele',
      behavioral_change: 'Alteração Comportamental',
      other: 'Outros'
    };
    return types[type as keyof typeof types] || type;
  };

  const getSeverityText = (severity: string) => {
    const severities = {
      mild: 'Leve',
      moderate: 'Moderada',
      severe: 'Grave',
      critical: 'Crítica'
    };
    return severities[severity as keyof typeof severities] || severity;
  };

  const getConsistencyText = (consistency: string) => {
    const consistencies = {
      solid: 'Sólida',
      soft: 'Pastosa',
      liquid: 'Líquida',
      hard: 'Endurecida',
      other: 'Outros'
    };
    return consistencies[consistency as keyof typeof consistencies] || consistency;
  };

  const getUrineColorText = (color: string) => {
    const colors = {
      clear: 'Clara',
      yellow: 'Amarela',
      dark_yellow: 'Amarelo Escuro',
      amber: 'Âmbar',
      brown: 'Marrom',
      red: 'Avermelhada',
      other: 'Outros'
    };
    return colors[color as keyof typeof colors] || color;
  };

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
      console.log('Creating test health data for user:', user.id);
      
      const result = await createTestHealthData(user.id, residents, user.organizationId);
      
      console.log('Test health data created, refreshing app data...');
      await refreshData();
      
      alert(`Dados de saúde de teste criados com sucesso!\n\n✅ ${result.vitalSigns.length} sinais vitais\n✅ ${result.eliminationRecords.length} registros de eliminação\n✅ ${result.intercurrences.length} intercorrências`);
    } catch (error) {
      console.error('Error creating test health data:', error);
      alert(`Erro ao criar dados de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setCreatingTestData(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    try {
      if (type === 'vital-signs') {
        await deleteVitalSigns(id);
      } else if (type === 'elimination') {
        await deleteEliminationRecord(id);
      } else if (type === 'intercurrence') {
        await deleteIntercurrence(id);
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Erro ao excluir registro. Tente novamente.`);
    }
  };

  // Filter, sort and paginate data
  const filterAndSortData = (data: any[], dateField: string) => {
    return data.filter(item => {
      const resident = residents.find(r => r.id === item.residentId);
      const matchesSearch = resident?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesResident = filterResident === 'all' || item.residentId === filterResident;
      const matchesDate = !filterDate || item[dateField].split('T')[0] === filterDate;
      
      let matchesPeriod = true;
      if (filterPeriod !== 'all' && !filterDate) {
        const days = parseInt(filterPeriod);
        const cutoffDate = subDays(new Date(), days);
        const itemDate = parseISO(item[dateField]);
        matchesPeriod = isAfter(itemDate, cutoffDate);
      }
      
      return matchesSearch && matchesResident && matchesPeriod && matchesDate;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a[dateField]).getTime();
        const dateB = new Date(b[dateField]).getTime();
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      } else if (sortBy === 'resident') {
        const residentA = residents.find(r => r.id === a.residentId)?.name || '';
        const residentB = residents.find(r => r.id === b.residentId)?.name || '';
        return sortDirection === 'desc' 
          ? residentB.localeCompare(residentA) 
          : residentA.localeCompare(residentB);
      } else if (sortBy === 'type' && 'type' in a) {
        return sortDirection === 'desc' 
          ? b.type.localeCompare(a.type) 
          : a.type.localeCompare(b.type);
      } else if (sortBy === 'severity' && 'severity' in a) {
        const severityOrder = { critical: 4, severe: 3, moderate: 2, mild: 1 };
        const severityA = severityOrder[a.severity as keyof typeof severityOrder] || 0;
        const severityB = severityOrder[b.severity as keyof typeof severityOrder] || 0;
        return sortDirection === 'desc' ? severityB - severityA : severityA - severityB;
      }
      return 0;
    });
  };

  const filteredVitalSigns = filterAndSortData(vitalSigns, 'recordedAt');
  const filteredEliminationRecords = filterAndSortData(eliminationRecords, 'recordedAt');
  const filteredIntercurrences = filterAndSortData(intercurrences, 'occurredAt');

  // Get current records for pagination
  const getCurrentRecords = () => {
    let filteredData: any[] = [];
    
    if (activeTab === 'vital-signs') {
      filteredData = filteredVitalSigns;
    } else if (activeTab === 'elimination') {
      filteredData = filteredEliminationRecords;
    } else if (activeTab === 'intercurrences') {
      filteredData = filteredIntercurrences;
    }
    
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    return filteredData.slice(indexOfFirstRecord, indexOfLastRecord);
  };

  const currentRecords = getCurrentRecords();
  const totalRecords = activeTab === 'vital-signs' 
    ? filteredVitalSigns.length 
    : activeTab === 'elimination' 
      ? filteredEliminationRecords.length 
      : filteredIntercurrences.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Reset pagination when filters or tab changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterResident, filterPeriod, filterDate, sortBy, sortDirection, activeTab]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registros de Saúde</h1>
          <p className="text-gray-600">Carregando dados de saúde...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Registros de Saúde</h1>
          <p className="text-gray-600">Monitoramento de sinais vitais, eliminações e intercorrências</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Registros de Saúde</h1>
          <p className="text-gray-600">Monitoramento de sinais vitais, eliminações e intercorrências</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
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
          <button 
            onClick={() => navigate('/health-records/new')}
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
              onClick={() => setActiveTab('vital-signs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'vital-signs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Sinais Vitais ({filteredVitalSigns.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('elimination')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'elimination'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4" />
                <span>Eliminações ({filteredEliminationRecords.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('intercurrences')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'intercurrences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Intercorrências ({filteredIntercurrences.length})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <HealthRecordsFilterControls
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterResident={filterResident}
            setFilterResident={setFilterResident}
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
            recordType={activeTab}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'vital-signs' && (
            <div className="space-y-6">
              {currentRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Residente
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pressão Arterial
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Saturação O₂
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Freq. Cardíaca
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Temperatura
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Glicose
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
                      {currentRecords.map((signs: any) => {
                        const status = getVitalSignsStatus(signs);
                        return (
                          <tr key={signs.id} className={`hover:bg-gray-50 ${status === 'abnormal' ? 'bg-red-50' : ''}`}>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {format(parseISO(signs.recordedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {getResidentName(signs.residentId)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {signs.systolicPressure && signs.diastolicPressure ? (
                                <span className={signs.systolicPressure > 180 || signs.systolicPressure < 90 ? 'text-red-600 font-medium' : ''}>
                                  {signs.systolicPressure}/{signs.diastolicPressure} mmHg
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {signs.oxygenSaturation ? (
                                <span className={signs.oxygenSaturation < 90 ? 'text-red-600 font-medium' : ''}>
                                  {signs.oxygenSaturation}%
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {signs.heartRate ? (
                                <span className={signs.heartRate > 100 || signs.heartRate < 60 ? 'text-red-600 font-medium' : ''}>
                                  {signs.heartRate} bpm
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {signs.temperature ? (
                                <span className={signs.temperature > 37.5 || signs.temperature < 35.5 ? 'text-red-600 font-medium' : ''}>
                                  {signs.temperature}°C
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {signs.glucose ? (
                                <span className={signs.glucose > 200 ? 'text-red-600 font-medium' : ''}>
                                  {signs.glucose} mg/dL
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 relative">
                              {signs.observations ? (
                                <div className="flex items-center">
                                  <div className="max-w-xs truncate">{signs.observations}</div>
                                  <button
                                    className="ml-1 text-gray-400 hover:text-gray-600"
                                    onMouseEnter={() => setTooltipContent({ id: signs.id, content: signs.observations })}
                                    onMouseLeave={() => setTooltipContent(null)}
                                  >
                                    <Info className="w-4 h-4" />
                                  </button>
                                  {tooltipContent?.id === signs.id && (
                                    <div className="absolute z-10 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs whitespace-normal left-0 top-10">
                                      {tooltipContent.content}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => navigate(`/health-records/edit/${signs.id}-vital-signs`)}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm({id: signs.id, type: 'vital-signs'})}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum sinal vital encontrado</p>
                  {(searchTerm || filterResident !== 'all' || filterPeriod !== 'all' || filterDate) && (
                    <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'elimination' && (
            <div className="space-y-6">
              {currentRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Residente
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Detalhes
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
                      {currentRecords.map((record: any) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {format(parseISO(record.recordedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {getResidentName(record.residentId)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              record.type === 'evacuation' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {record.type === 'evacuation' ? 'Evacuação' : 'Urina'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {record.type === 'evacuation' ? (
                              <div>
                                <div><strong>Quantidade:</strong> {record.evacuationCount || '-'}</div>
                                <div><strong>Consistência:</strong> {record.evacuationConsistency ? getConsistencyText(record.evacuationConsistency) : '-'}</div>
                              </div>
                            ) : (
                              <div>
                                <div><strong>Volume:</strong> {record.urineVolume ? `${record.urineVolume} ml` : '-'}</div>
                                <div><strong>Cor:</strong> {record.urineColor ? getUrineColorText(record.urineColor) : '-'}</div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 relative">
                            {record.observations ? (
                              <div className="flex items-center">
                                <div className="max-w-xs truncate">{record.observations}</div>
                                <button
                                  className="ml-1 text-gray-400 hover:text-gray-600"
                                  onMouseEnter={() => setTooltipContent({ id: record.id, content: record.observations })}
                                  onMouseLeave={() => setTooltipContent(null)}
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                                {tooltipContent?.id === record.id && (
                                  <div className="absolute z-10 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs whitespace-normal left-0 top-10">
                                    {tooltipContent.content}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => navigate(`/health-records/edit/${record.id}-elimination`)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm({id: record.id, type: 'elimination'})}
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
                  <Droplets className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum registro de eliminação encontrado</p>
                  {(searchTerm || filterResident !== 'all' || filterPeriod !== 'all' || filterDate) && (
                    <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'intercurrences' && (
            <div className="space-y-6">
              {currentRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Residente
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Severidade
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações Tomadas
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentRecords.map((intercurrence: any) => (
                        <tr key={intercurrence.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {format(parseISO(intercurrence.occurredAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {getResidentName(intercurrence.residentId)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {getTypeText(intercurrence.type)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(intercurrence.severity)}`}>
                              {getSeverityText(intercurrence.severity)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 relative">
                            <div className="flex items-center">
                              <div className="max-w-xs truncate">{intercurrence.description}</div>
                              <button
                                className="ml-1 text-gray-400 hover:text-gray-600"
                                onMouseEnter={() => setTooltipContent({ id: intercurrence.id, content: intercurrence.description })}
                                onMouseLeave={() => setTooltipContent(null)}
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              {tooltipContent?.id === intercurrence.id && (
                                <div className="absolute z-10 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs whitespace-normal left-0 top-10">
                                  {tooltipContent.content}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 relative">
                            {intercurrence.actionsTaken ? (
                              <div className="flex items-center">
                                <div className="max-w-xs truncate">{intercurrence.actionsTaken}</div>
                                <button
                                  className="ml-1 text-gray-400 hover:text-gray-600"
                                  onMouseEnter={() => setTooltipContent({ id: `actions-${intercurrence.id}`, content: intercurrence.actionsTaken })}
                                  onMouseLeave={() => setTooltipContent(null)}
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                                {tooltipContent?.id === `actions-${intercurrence.id}` && (
                                  <div className="absolute z-10 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs whitespace-normal left-0 top-10">
                                    {tooltipContent.content}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => navigate(`/health-records/edit/${intercurrence.id}-intercurrence`)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm({id: intercurrence.id, type: 'intercurrence'})}
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
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma intercorrência encontrada</p>
                  {(searchTerm || filterResident !== 'all' || filterPeriod !== 'all' || filterDate) && (
                    <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Mostrando {(currentPage - 1) * recordsPerPage + 1}-{Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
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
      </div>

      {/* Empty State */}
      {vitalSigns.length === 0 && eliminationRecords.length === 0 && intercurrences.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum registro de saúde encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              Comece criando dados de teste ou adicione os primeiros registros de saúde.
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
                onClick={() => navigate('/health-records/new')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeiro Registro</span>
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
                  onClick={() => handleDelete(showDeleteConfirm.id, showDeleteConfirm.type)}
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
