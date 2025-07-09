import React, { useState } from 'react';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  CheckCircle2, 
  Zap
} from 'lucide-react';
import { useAI } from '../../contexts/AIContext';

interface AIInsightsPanelProps {
  residentId?: string;
  residentName?: string;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ residentId, residentName }) => {
  const { isAnalyzing, lastAnalysis, analyzeHealthPatterns } = useAI();
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      await analyzeHealthPatterns(residentId);
    } catch (error) {
      console.error('Erro ao analisar padrões de saúde:', error);
    }
  };

  const toggleInsight = (title: string) => {
    if (expandedInsight === title) {
      setExpandedInsight(null);
    } else {
      setExpandedInsight(title);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'alert': return AlertCircle;
      case 'trend': return TrendingUp;
      default: return Brain;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-blue-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Análise Preditiva com IA</h3>
            <p className="text-sm text-gray-500">
              {residentName 
                ? `Análise para ${residentName}` 
                : 'Análise para todos os residentes'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Atualizar análise"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isAnalyzing ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
          </div>
          <p className="text-gray-700 font-medium">Analisando dados de saúde...</p>
          <p className="text-sm text-gray-500 mt-1">A IA está processando padrões e tendências</p>
        </div>
      ) : lastAnalysis ? (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Resumo da Análise
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  {lastAnalysis.summary}
                </p>
                <div className="flex items-center mt-2 text-xs text-purple-600">
                  <span className="font-medium">Nível de Risco: </span>
                  <div className="w-24 h-2 bg-purple-200 rounded-full mx-2">
                    <div 
                      className="h-2 bg-purple-600 rounded-full" 
                      style={{ width: `${lastAnalysis.riskScore * 100}%` }}
                    ></div>
                  </div>
                  <span>{Math.round(lastAnalysis.riskScore * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Insights da IA ({lastAnalysis.insights.length})</h4>
            
            {lastAnalysis.insights.map((insight, index) => {
              const InsightIcon = getInsightIcon(insight.type);
              const isExpanded = expandedInsight === insight.title;
              
              return (
                <div 
                  key={index} 
                  className={`border rounded-lg overflow-hidden ${getSeverityColor(insight.severity)}`}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => toggleInsight(insight.title)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <InsightIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{insight.title}</p>
                          {!isExpanded && (
                            <p className="text-sm mt-1 line-clamp-2">{insight.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium px-2 py-1 bg-white bg-opacity-50 rounded-full">
                          {insight.severity === 'critical' ? 'Crítico' : 
                           insight.severity === 'high' ? 'Alto' : 
                           insight.severity === 'medium' ? 'Médio' : 'Baixo'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-4 border-t border-current border-opacity-20 bg-white bg-opacity-50">
                      <p className="text-sm mb-4">{insight.description}</p>
                      
                      {insight.recommendations.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium mb-2">Recomendações:</p>
                          <ul className="text-sm space-y-1">
                            {insight.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-4">
                          <span>
                            Confiança: <span className={`font-medium ${getConfidenceColor(insight.confidence)}`}>
                              {Math.round(insight.confidence * 100)}%
                            </span>
                          </span>
                          <span>Pontos de dados: {insight.dataPoints}</span>
                        </div>
                        <span>Período: {insight.timeframe === '30_days' ? 'Últimos 30 dias' : insight.timeframe}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xs text-gray-500 text-center">
            Próxima análise recomendada: {new Date(lastAnalysis.nextReviewDate).toLocaleDateString('pt-BR')}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-700 font-medium">Nenhuma análise realizada</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Clique no botão abaixo para iniciar uma análise preditiva
          </p>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <Brain className="w-4 h-4" />
            <span>Analisar Dados de Saúde</span>
          </button>
        </div>
      )}
    </div>
  );
};
