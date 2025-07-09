import React, { useEffect, useState } from 'react';
import { Users, Pill, AlertTriangle, Heart, Brain } from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { ActivityCard } from '../components/dashboard/ActivityCard';
import { NotificationSummary } from '../components/dashboard/NotificationSummary';
import { AIInsightCard } from '../components/dashboard/AIInsightCard';
import { useApp } from '../contexts/AppContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { residents, medications, caregivers, isLoading } = useApp();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  // Filter AI notifications
  useEffect(() => {
    const insights = notifications.filter(n => n.category === 'ai');
    setAiInsights(insights);
  }, [notifications]);

  // Calculate metrics
  const totalResidents = residents.length;
  const activeMedications = medications.filter(m => m.status === 'active').length;
  const criticalPatients = residents.filter(r => r.healthStatus === 'critical').length;
  const occupationRate = Math.round((totalResidents / 50) * 100); // Assuming 50 total capacity

  // Generate recent activities from real data
  const recentActivities = [
    ...medications.slice(0, 2).map(med => ({
      id: `med-${med.id}`,
      type: 'medication' as const,
      title: 'Medicação ativa',
      description: `${med.name} ${med.dosage} - ${residents.find(r => r.id === med.residentId)?.name || 'Residente'}`,
      time: 'Ativo',
      priority: 'medium' as const
    })),
    ...residents.filter(r => r.healthStatus === 'critical').slice(0, 1).map(resident => ({
      id: `critical-${resident.id}`,
      type: 'emergency' as const,
      title: 'Atenção médica necessária',
      description: `${resident.name} - Status crítico`,
      time: 'Monitoramento contínuo',
      priority: 'high' as const
    }))
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral da instituição</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Residentes"
          value={totalResidents}
          icon={Users}
          iconColor="bg-blue-500"
          description={`${occupationRate}% de ocupação`}
        />
        <MetricCard
          title="Medicações Ativas"
          value={activeMedications}
          icon={Pill}
          iconColor="bg-green-500"
        />
        <MetricCard
          title="Pacientes Críticos"
          value={criticalPatients}
          icon={AlertTriangle}
          iconColor="bg-red-500"
        />
        <MetricCard
          title="Insights de IA"
          value={aiInsights.length}
          icon={Brain}
          iconColor="bg-purple-500"
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Cuidadores Ativos"
          value={caregivers?.length || 0}
          icon={Heart}
          iconColor="bg-pink-500"
        />
        <MetricCard
          title="Consultas Hoje"
          value="8"
          icon={Heart}
          iconColor="bg-orange-500"
        />
        <MetricCard
          title="Residentes Estáveis"
          value={residents.filter(r => r.healthStatus === 'stable').length}
          icon={Heart}
          iconColor="bg-green-500"
        />
      </div>

      {/* Activities and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityCard activities={recentActivities} />
        <NotificationSummary />
      </div>

      {/* AI Insights and Health Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIInsightCard 
          insights={aiInsights}
          onViewAll={() => navigate('/ai-analytics')}
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status de Saúde</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Estável</span>
              </div>
              <span className="text-sm text-gray-900 font-semibold">
                {residents.filter(r => r.healthStatus === 'stable').length} pacientes
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Atenção</span>
              </div>
              <span className="text-sm text-gray-900 font-semibold">
                {residents.filter(r => r.healthStatus === 'attention').length} pacientes
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Crítico</span>
              </div>
              <span className="text-sm text-gray-900 font-semibold">
                {residents.filter(r => r.healthStatus === 'critical').length} pacientes
              </span>
            </div>
          </div>

          {totalResidents === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                Nenhum residente cadastrado ainda.
                <br />
                Comece adicionando residentes ao sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
