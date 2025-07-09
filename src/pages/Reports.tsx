import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Pill, 
  Heart, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Search,
  Eye,
  X,
  Baby,
  MessageCircle
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
  totalResidents: number;
  totalMedications: number;
  totalCaregivers: number;
  totalFamilyMessages: number;
  totalDiaperUsages: number;
  unreadMessages: number;
  criticalPatients: number;
  activeMedications: number;
  occupancyRate: number;
  averageAge: number;
  genderDistribution: { male: number; female: number };
  healthStatusDistribution: { stable: number; attention: number; critical: number };
  medicationsByStatus: { active: number; paused: number; completed: number };
  messagesByType: { update: number; request: number; emergency: number; response: number };
  diaperUsageByShift: { morning: number; afternoon: number; night: number };
  diaperUsageByMonth: { month: string; total: number }[];
  monthlyAdmissions: { month: string; count: number }[];
  caregiversByShift: { morning: number; afternoon: number; night: number };
  medicationFrequency: { name: string; count: number }[];
  residentsByRoom: { room: string; count: number }[];
}

interface DetailedReport {
  id: string;
  title: string;
  description: string;
  type: 'residents' | 'medications' | 'family' | 'health' | 'occupancy' | 'diaper-usage';
  data: any[];
  generatedAt: string;
}

export const Reports: React.FC = () => {
  const { 
    residents, 
    medications, 
    caregivers, 
    familyMessages,
    diaperUsages,
    diaperTypes,
    isLoading 
  } = useApp();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedReportType, setSelectedReportType] = useState<'overview' | 'detailed'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'residents' | 'medications' | 'family' | 'diaper-usage'>('all');
  const [viewingReport, setViewingReport] = useState<DetailedReport | null>(null);

  // Calculate comprehensive report data
  const reportData: ReportData = useMemo(() => {
    const totalResidents = residents.length;
    const totalMedications = medications.length;
    const totalCaregivers = caregivers.length;
    const totalFamilyMessages = familyMessages?.length || 0;
    const totalDiaperUsages = diaperUsages.length;
    
    const unreadMessages = familyMessages?.filter(m => !m.read).length || 0;
    const criticalPatients = residents.filter(r => r.healthStatus === 'critical').length;
    const activeMedications = medications.filter(m => m.status === 'active').length;
    
    const occupancyRate = Math.round((totalResidents / 50) * 100); // Assuming 50 bed capacity
    const averageAge = totalResidents > 0 ? Math.round(residents.reduce((sum, r) => sum + r.age, 0) / totalResidents) : 0;
    
    const genderDistribution = {
      male: residents.filter(r => r.gender === 'M').length,
      female: residents.filter(r => r.gender === 'F').length
    };
    
    const healthStatusDistribution = {
      stable: residents.filter(r => r.healthStatus === 'stable').length,
      attention: residents.filter(r => r.healthStatus === 'attention').length,
      critical: residents.filter(r => r.healthStatus === 'critical').length
    };
    
    const medicationsByStatus = {
      active: medications.filter(m => m.status === 'active').length,
      paused: medications.filter(m => m.status === 'paused').length,
      completed: medications.filter(m => m.status === 'completed').length
    };
    
    const messagesByType = {
      update: familyMessages?.filter(m => m.type === 'update').length || 0,
      request: familyMessages?.filter(m => m.type === 'request').length || 0,
      emergency: familyMessages?.filter(m => m.type === 'emergency').length || 0,
      response: familyMessages?.filter(m => m.type === 'response').length || 0
    };

    // Diaper usage analytics
    const diaperUsageByShift = {
      morning: diaperUsages.filter(d => d.shift === 'morning').reduce((sum, d) => sum + d.quantity, 0),
      afternoon: diaperUsages.filter(d => d.shift === 'afternoon').reduce((sum, d) => sum + d.quantity, 0),
      night: diaperUsages.filter(d => d.shift === 'night').reduce((sum, d) => sum + d.quantity, 0)
    };

    // Diaper usage by month (last 6 months)
    const diaperUsageByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthLabel = format(date, 'MMM/yy', { locale: ptBR });
      
      const total = diaperUsages
        .filter(d => d.date.startsWith(monthStr))
        .reduce((sum, d) => sum + d.quantity, 0);
      
      diaperUsageByMonth.push({
        month: monthLabel,
        total
      });
    }
    
    // Monthly admissions (last 12 months)
    const monthlyAdmissions = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
      const count = residents.filter(r => r.admissionDate.startsWith(monthStr)).length;
      monthlyAdmissions.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        count
      });
    }
    
    const caregiversByShift = {
      morning: caregivers.filter(c => c.shift === 'morning').length,
      afternoon: caregivers.filter(c => c.shift === 'afternoon').length,
      night: caregivers.filter(c => c.shift === 'night').length
    };
    
    // Most common medications
    const medicationCounts = medications.reduce((acc, med) => {
      acc[med.name] = (acc[med.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const medicationFrequency = Object.entries(medicationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Residents by room (room occupancy)
    const roomCounts = residents.reduce((acc, resident) => {
      acc[resident.room] = (acc[resident.room] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const residentsByRoom = Object.entries(roomCounts)
      .map(([room, count]) => ({ room, count }))
      .sort((a, b) => a.room.localeCompare(b.room));
    
    return {
      totalResidents,
      totalMedications,
      totalCaregivers,
      totalFamilyMessages,
      totalDiaperUsages,
      unreadMessages,
      criticalPatients,
      activeMedications,
      occupancyRate,
      averageAge,
      genderDistribution,
      healthStatusDistribution,
      medicationsByStatus,
      messagesByType,
      diaperUsageByShift,
      diaperUsageByMonth,
      monthlyAdmissions,
      caregiversByShift,
      medicationFrequency,
      residentsByRoom
    };
  }, [residents, medications, caregivers, familyMessages, diaperUsages]);

  // Generate detailed reports
  const generateDetailedReport = (type: DetailedReport['type']): DetailedReport => {
    const now = new Date().toLocaleString('pt-BR');
    
    switch (type) {
      case 'residents':
        return {
          id: `residents-${Date.now()}`,
          title: 'Relatório Detalhado de Residentes',
          description: 'Informações completas sobre todos os residentes',
          type: 'residents',
          data: residents.map(r => ({
            nome: r.name,
            idade: r.age,
            genero: r.gender === 'M' ? 'Masculino' : 'Feminino',
            quarto: r.room,
            dataAdmissao: new Date(r.admissionDate).toLocaleDateString('pt-BR'),
            statusSaude: r.healthStatus === 'stable' ? 'Estável' : 
                        r.healthStatus === 'attention' ? 'Atenção' : 'Crítico',
            contatoEmergencia: r.emergencyContact.name,
            telefoneEmergencia: r.emergencyContact.phone,
            parentesco: r.emergencyContact.relation,
            observacoes: r.notes || 'Nenhuma'
          })),
          generatedAt: now
        };
      
      case 'medications':
        return {
          id: `medications-${Date.now()}`,
          title: 'Relatório de Medicações',
          description: 'Lista completa de medicações por residente',
          type: 'medications',
          data: medications.map(m => {
            const resident = residents.find(r => r.id === m.residentId);
            return {
              medicamento: m.name,
              dosagem: m.dosage,
              frequencia: m.frequency,
              horarios: m.time.join(', '),
              residente: resident?.name || 'Não encontrado',
              quarto: resident?.room || '-',
              prescritoPor: m.prescribedBy,
              dataInicio: new Date(m.startDate).toLocaleDateString('pt-BR'),
              dataFim: m.endDate ? new Date(m.endDate).toLocaleDateString('pt-BR') : 'Em andamento',
              status: m.status === 'active' ? 'Ativo' : 
                     m.status === 'paused' ? 'Pausado' : 'Concluído'
            };
          }),
          generatedAt: now
        };
      
      case 'family':
        return {
          id: `family-${Date.now()}`,
          title: 'Relatório de Comunicação Familiar',
          description: 'Mensagens e comunicações com familiares',
          type: 'family',
          data: (familyMessages || []).map(m => {
            const resident = residents.find(r => r.id === m.residentId);
            return {
              residente: resident?.name || 'Não encontrado',
              remetente: m.from,
              mensagem: m.message,
              tipo: m.type === 'update' ? 'Atualização' : 
                   m.type === 'request' ? 'Solicitação' : 
                   m.type === 'emergency' ? 'Emergência' : 'Resposta',
              data: new Date(m.date).toLocaleDateString('pt-BR'),
              lida: m.read ? 'Sim' : 'Não'
            };
          }),
          generatedAt: now
        };
      
      case 'health':
        return {
          id: `health-${Date.now()}`,
          title: 'Relatório de Saúde',
          description: 'Status de saúde e medicações por residente',
          type: 'health',
          data: residents.map(r => {
            const residentMeds = medications.filter(m => m.residentId === r.id && m.status === 'active');
            return {
              nome: r.name,
              idade: r.age,
              quarto: r.room,
              statusSaude: r.healthStatus === 'stable' ? 'Estável' : 
                          r.healthStatus === 'attention' ? 'Atenção' : 'Crítico',
              medicacoesAtivas: residentMeds.length,
              medicamentos: residentMeds.map(m => `${m.name} (${m.dosage})`).join(', ') || 'Nenhuma',
              observacoes: r.notes || 'Nenhuma'
            };
          }),
          generatedAt: now
        };
      
      case 'occupancy':
        return {
          id: `occupancy-${Date.now()}`,
          title: 'Relatório de Ocupação',
          description: 'Taxa de ocupação por quarto e período',
          type: 'occupancy',
          data: reportData.residentsByRoom.map(r => ({
            quarto: r.room,
            ocupantes: r.count,
            capacidade: 1, // Assuming 1 bed per room
            taxaOcupacao: '100%', // Since we're showing occupied rooms
            residentes: residents
              .filter(res => res.room === r.room)
              .map(res => res.name)
              .join(', ')
          })),
          generatedAt: now
        };

      case 'diaper-usage':
        return {
          id: `diaper-usage-${Date.now()}`,
          title: 'Relatório de Uso de Fraldas',
          description: 'Controle detalhado do uso de fraldas por residente',
          type: 'diaper-usage',
          data: diaperUsages.map(d => {
            const resident = residents.find(r => r.id === d.residentId);
            const diaperType = diaperTypes.find(t => t.id === d.diaperTypeId);
            const totalCost = diaperType ? (diaperType.unitCost * d.quantity) : 0;
            
            return {
              data: format(new Date(d.date), 'dd/MM/yyyy'),
              residente: resident?.name || 'Não encontrado',
              quarto: resident?.room || '-',
              turno: d.shift === 'morning' ? 'Manhã' : 
                    d.shift === 'afternoon' ? 'Tarde' : 'Noite',
              quantidade: d.quantity,
              tipoFralda: diaperType?.name || '-',
              marca: diaperType?.brand || '-',
              tamanho: diaperType?.size || '-',
              custoUnitario: diaperType ? `R$ ${diaperType.unitCost.toFixed(2)}` : '-',
              custoTotal: diaperType ? `R$ ${totalCost.toFixed(2)}` : '-',
              observacoes: d.observations || '-'
            };
          }),
          generatedAt: now
        };
      
      default:
        return {
          id: `general-${Date.now()}`,
          title: 'Relatório Geral',
          description: 'Visão geral do sistema',
          type: 'residents',
          data: [],
          generatedAt: now
        };
    }
  };

  const exportToCSV = (report: DetailedReport) => {
    if (report.data.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }

    const headers = Object.keys(report.data[0]);
    const csvContent = [
      headers.join(','),
      ...report.data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    trend, 
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string; 
    trend?: { value: number; isPositive: boolean }; 
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs. período anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ 
    title, 
    children, 
    onViewDetails 
  }: { 
    title: string; 
    children: React.ReactNode; 
    onViewDetails?: () => void;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Detalhes</span>
          </button>
        )}
      </div>
      {children}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análises e estatísticas do sistema</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="quarter">Último Trimestre</option>
            <option value="year">Último Ano</option>
          </select>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedReportType('overview')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedReportType === 'overview' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setSelectedReportType('detailed')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedReportType === 'detailed' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Detalhado
            </button>
          </div>
        </div>
      </div>

      {selectedReportType === 'overview' ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total de Residentes"
              value={reportData.totalResidents}
              icon={Users}
              color="bg-blue-500"
              subtitle={`Taxa de ocupação: ${reportData.occupancyRate}%`}
            />
            <MetricCard
              title="Medicações Ativas"
              value={reportData.activeMedications}
              icon={Pill}
              color="bg-green-500"
              subtitle={`${reportData.totalMedications} total`}
            />
            <MetricCard
              title="Pacientes Críticos"
              value={reportData.criticalPatients}
              icon={AlertTriangle}
              color="bg-red-500"
              subtitle="Requer atenção especial"
            />
            <MetricCard
              title="Uso de Fraldas"
              value={reportData.totalDiaperUsages}
              icon={Baby}
              color="bg-cyan-500"
              subtitle="Registros totais"
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Cuidadores Ativos"
              value={reportData.totalCaregivers}
              icon={Heart}
              color="bg-pink-500"
            />
            <MetricCard
              title="Idade Média"
              value={`${reportData.averageAge} anos`}
              icon={Clock}
              color="bg-orange-500"
            />
            <MetricCard
              title="Mensagens Familiares"
              value={reportData.totalFamilyMessages}
              icon={MessageCircle}
              color="bg-purple-500"
            />
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Status Distribution */}
            <ChartCard 
              title="Distribuição por Status de Saúde"
              onViewDetails={() => setViewingReport(generateDetailedReport('health'))}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Estável</span>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">
                    {reportData.healthStatusDistribution.stable} pacientes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Atenção</span>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">
                    {reportData.healthStatusDistribution.attention} pacientes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Crítico</span>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">
                    {reportData.healthStatusDistribution.critical} pacientes
                  </span>
                </div>
              </div>
            </ChartCard>

            {/* Diaper Usage by Shift */}
            <ChartCard 
              title="Uso de Fraldas por Turno"
              onViewDetails={() => setViewingReport(generateDetailedReport('diaper-usage'))}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Manhã</span>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">
                    {reportData.diaperUsageByShift.morning} fraldas
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Tarde</span>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">
                    {reportData.diaperUsageByShift.afternoon} fraldas
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Noite</span>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">
                    {reportData.diaperUsageByShift.night} fraldas
                  </span>
                </div>
              </div>
            </ChartCard>

            {/* Gender Distribution */}
            <ChartCard 
              title="Distribuição por Gênero"
              onViewDetails={() => setViewingReport(generateDetailedReport('residents'))}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Masculino</span>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">
                    {reportData.genderDistribution.male} residentes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Feminino</span>
                  </div>
                  <span className="text-sm text-gray-900 font-semibold">
                    {reportData.genderDistribution.female} residentes
                  </span>
                </div>
              </div>
            </ChartCard>

            {/* Diaper Usage Trend */}
            <ChartCard 
              title="Tendência de Uso de Fraldas (6 meses)"
              onViewDetails={() => setViewingReport(generateDetailedReport('diaper-usage'))}
            >
              <div className="space-y-3">
                {reportData.diaperUsageByMonth.slice(-3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.month}</span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {item.total} fraldas
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Top Medications */}
          {reportData.medicationFrequency.length > 0 && (
            <ChartCard 
              title="Medicamentos Mais Utilizados"
              onViewDetails={() => setViewingReport(generateDetailedReport('medications'))}
            >
              <div className="space-y-3">
                {reportData.medicationFrequency.slice(0, 5).map((med, index) => (
                  <div key={med.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-700">{med.name}</span>
                    </div>
                    <span className="text-sm text-gray-900 font-semibold">
                      {med.count} prescrições
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </>
      ) : (
        /* Detailed Reports */
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar relatórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Tipos</option>
                <option value="residents">Residentes</option>
                <option value="medications">Medicações</option>
                <option value="family">Familiares</option>
                <option value="diaper-usage">Uso de Fraldas</option>
              </select>
            </div>
          </div>

          {/* Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                type: 'residents' as const,
                title: 'Relatório de Residentes',
                description: 'Informações completas sobre todos os residentes',
                icon: Users,
                color: 'bg-blue-500',
                count: reportData.totalResidents
              },
              {
                type: 'medications' as const,
                title: 'Relatório de Medicações',
                description: 'Lista detalhada de medicações por residente',
                icon: Pill,
                color: 'bg-green-500',
                count: reportData.totalMedications
              },
              {
                type: 'family' as const,
                title: 'Relatório de Comunicação',
                description: 'Mensagens e comunicações com familiares',
                icon: Activity,
                color: 'bg-purple-500',
                count: reportData.totalFamilyMessages
              },
              {
                type: 'health' as const,
                title: 'Relatório de Saúde',
                description: 'Status de saúde e medicações por residente',
                icon: Heart,
                color: 'bg-red-500',
                count: reportData.totalResidents
              },
              {
                type: 'occupancy' as const,
                title: 'Relatório de Ocupação',
                description: 'Taxa de ocupação por quarto e período',
                icon: BarChart3,
                color: 'bg-teal-500',
                count: reportData.residentsByRoom.length
              },
              {
                type: 'diaper-usage' as const,
                title: 'Relatório de Uso de Fraldas',
                description: 'Controle detalhado do uso de fraldas por residente',
                icon: Baby,
                color: 'bg-cyan-500',
                count: reportData.totalDiaperUsages
              }
            ].map((report) => (
              <div key={report.type} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <report.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{report.count}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setViewingReport(generateDetailedReport(report.type))}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Visualizar</span>
                  </button>
                  <button
                    onClick={() => {
                      const detailedReport = generateDetailedReport(report.type);
                      exportToCSV(detailedReport);
                    }}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Report Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{viewingReport.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{viewingReport.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Gerado em: {viewingReport.generatedAt}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => exportToCSV(viewingReport)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar CSV</span>
                  </button>
                  <button
                    onClick={() => setViewingReport(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              {viewingReport.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(viewingReport.data[0]).map((header) => (
                          <th
                            key={header}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewingReport.data.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row).map((value, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum dado disponível para este relatório.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
