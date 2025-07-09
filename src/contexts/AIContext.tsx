import React, { createContext, useContext, useState, ReactNode } from 'react';
import { aiHealthService } from '../services/aiService';
import { useAuth } from './AuthContext';

interface AIInsight {
  type: 'prediction' | 'recommendation' | 'alert' | 'trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendations: string[];
  confidence: number;
  dataPoints: number;
  timeframe: string;
  metadata: Record<string, any>;
}

interface AIAnalysisResult {
  insights: AIInsight[];
  summary: string;
  riskScore: number;
  nextReviewDate: string;
}

interface AIContextType {
  isAnalyzing: boolean;
  lastAnalysis: AIAnalysisResult | null;
  analyzeHealthPatterns: (residentId?: string) => Promise<AIAnalysisResult>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AIAnalysisResult | null>(null);

  const analyzeHealthPatterns = async (residentId?: string): Promise<AIAnalysisResult> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setIsAnalyzing(true);
    try {
      const result = await aiHealthService.analyzeHealthPatterns(user.id, residentId);
      setLastAnalysis(result);
      return result;
    } catch (error) {
      console.error('Erro na análise de IA:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AIContext.Provider value={{
      isAnalyzing,
      lastAnalysis,
      analyzeHealthPatterns
    }}>
      {children}
    </AIContext.Provider>
  );
};
