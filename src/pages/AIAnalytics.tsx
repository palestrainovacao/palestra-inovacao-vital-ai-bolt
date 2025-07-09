import React, { useState } from 'react';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Zap,
  Sparkles,
  BarChart3,
  Activity
} from 'lucide-react';
import { useAI } from '../contexts/AIContext';
import { useApp } from '../contexts/AppContext';
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel';

export const AIAnalytics: React.FC = () => {
  const { isAnalyzing, lastAnalysis, analyzeHealthPatterns } = useAI();
  const { residents } = useApp();
  const [selectedResident, setSelectedResident] = useState<string>('all');

  const handleAnalyze = async () => {
    try {
      const residentId = selectedResident === 'all' ? undefined : selectedResident;
      await analyzeHealthPatterns(residentId);
    } catch (error) {
      console.error('Erro ao analisar padrões de saúde:', error);
      alert(`Erro ao analisar padrões de saúde:\n\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const getResidentName = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    return resident ? resident.name : 'Residente não encontrado';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análise Preditiva com IA</h1>
          <p className="text-gray-600">Insights inteligentes e previsões de saúde</p>
        </div>
      </div>

      {/* Resident Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Selecione o Residente</h3>
            <p className="text-sm text-gray-600">Escolha um residente específico ou analise todos</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedResident}
              onChange={(e) => setSelectedResident(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Todos os Residentes</option>
              {residents.map(resident => (
                <option key={resident.id} value={resident.id}>
                  {resident.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              <span>{isAnalyzing ? 'Analisando...' : 'Analisar Dados'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel 
        residentId={selectedResident === 'all' ? undefined : selectedResident}
        residentName={selectedResident === 'all' ? undefined : getResidentName(selectedResident)}
      />

      {/* AI Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Análise Preditiva</h3>
          <p className="text-gray-600 mb-4">
            Identifica padrões nos dados de saúde para prever possíveis complicações antes que se tornem críticas.
          </p>
          <div className="text-sm text-blue-600 font-medium">
            Previsão até 7 dias de antecedência
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
            <Lightbulb className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recomendações Inteligentes</h3>
          <p className="text-gray-600 mb-4">
            Sugestões personalizadas baseadas em evidências médicas e no histórico individual de cada residente.
          </p>
          <div className="text-sm text-green-600 font-medium">
            Baseado em protocolos geriátricos
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="p-3 bg-red-100 rounded-lg w-fit mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Alertas Críticos</h3>
          <p className="text-gray-600 mb-4">
            Detecção automática de situações que requerem atenção médica imediata, com notificações em tempo real.
          </p>
          <div className="text-sm text-red-600 font-medium">
            Monitoramento 24/7
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Como Funciona a IA Preditiva</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Coleta de Dados</h4>
            <p className="text-sm text-gray-600">
              Sinais vitais, intercorrências e registros de eliminação são coletados continuamente
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Análise de Padrões</h4>
            <p className="text-sm text-gray-600">
              Algoritmos avançados identificam tendências e correlações nos dados
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Processamento IA</h4>
            <p className="text-sm text-gray-600">
              Modelos de IA analisam os dados com base em conhecimento médico especializado
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Insights Acionáveis</h4>
            <p className="text-sm text-gray-600">
              Recomendações práticas e alertas são gerados para a equipe de cuidados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
