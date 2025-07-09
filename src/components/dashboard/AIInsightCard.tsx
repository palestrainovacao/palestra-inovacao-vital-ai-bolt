import React, { useState } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIInsight {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'ai';
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  residentId?: string;
  residentName?: string;
  metadata?: {
    recommendations?: string[];
    confidence?: number;
    dataPoints?: number;
    urgency?: string;
  };
}

interface AIInsightCardProps {
  insights: AIInsight[];
  onViewAll: () => void;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ insights, onViewAll }) => {
  const navigate = useNavigate();
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const toggleInsight = (id: string) => {
    if (expandedInsight === id) {
      setExpandedInsight(null);
    } else {
      setExpandedInsight(id);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return AlertCircle;
      case 'warning': return TrendingUp;
      case 'info': return Lightbulb;
      case 'success': return CheckCircle2;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getUrgencyText = (urgency?: string) => {
    switch (urgency) {
      case 'immediate': return 'Ação imediata';
      case 'within_24h': return 'Nas próximas 24h';
      case 'within_week': return 'Na próxima semana';
      case 'routine': return 'Rotina';
      default: return 'Não especificado';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Insights da IA</h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Ver Todos
        </button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {insights.length > 0 ? (
          insights.map((insight) => {
            const InsightIcon = getInsightIcon(insight.type);
            const isExpanded = expandedInsight === insight.id;
            
            return (
              <div 
                key={insight.id} 
                className={`border rounded-lg overflow-hidden ${getInsightColor(insight.type)}`}
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleInsight(insight.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <InsightIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{insight.title}</p>
                        {!isExpanded && (
                          <p className="text-sm mt-1 line-clamp-2">{insight.message}</p>
                        )}
                        {insight.residentName && (
                          <p className="text-xs mt-1">Residente: {insight.residentName}</p>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-4 border-t border-current border-opacity-20 bg-white bg-opacity-50">
                    <p className="text-sm mb-4">{insight.message}</p>
                    
                    {insight.metadata?.recommendations && insight.metadata.recommendations.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium mb-2">Recomendações:</p>
                        <ul className="text-sm space-y-1">
                          {insight.metadata.recommendations.map((rec, idx) => (
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
                        {insight.metadata?.confidence && (
                          <span>
                            Confiança: <span className="font-medium">
                              {Math.round(insight.metadata.confidence * 100)}%
                            </span>
                          </span>
                        )}
                        {insight.metadata?.dataPoints && (
                          <span>Pontos de dados: {insight.metadata.dataPoints}</span>
                        )}
                      </div>
                      {insight.metadata?.urgency && (
                        <span>Urgência: {getUrgencyText(insight.metadata.urgency)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Nenhum insight da IA disponível</p>
            <p className="text-sm text-gray-400 mt-1">Clique em "Ver Todos" para realizar uma análise</p>
          </div>
        )}
      </div>
    </div>
  );
};
