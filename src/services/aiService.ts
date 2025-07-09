import { supabase } from '../lib/supabase';

interface HealthPattern {
  residentId: string;
  residentName: string;
  vitalSigns: any[];
  intercurrences: any[];
  eliminationRecords: any[];
  timeframe: string;
}

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

interface OpenAIResponse {
  insights: AIInsight[];
  summary: string;
  riskScore: number;
  nextReviewDate: string;
}

class AIHealthService {
  async analyzeHealthPatterns(userId: string, residentId?: string): Promise<OpenAIResponse> {
    try {
      // Call the Supabase Edge Function instead of OpenAI directly
      const { data, error } = await supabase.functions.invoke('ai-health-analysis', {
        body: { userId, residentId }
      });

      if (error) {
        console.error('Error calling AI health analysis function:', error);
        throw new Error(`Erro na análise de IA: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in AI analysis:', error);
      throw error;
    }
  }

  private async fetchHealthData(userId: string, residentId?: string): Promise<HealthPattern[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Buscar residentes
    let residentsQuery = supabase
      .from('residents')
      .select('*')
      .eq('user_id', userId);

    if (residentId) {
      residentsQuery = residentsQuery.eq('id', residentId);
    }

    const { data: residents, error: residentsError } = await residentsQuery;
    
    if (residentsError) throw residentsError;

    const healthPatterns: HealthPattern[] = [];

    for (const resident of residents || []) {
      // Buscar sinais vitais
      const { data: vitalSigns } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('resident_id', resident.id)
        .gte('recorded_at', thirtyDaysAgo.toISOString())
        .order('recorded_at', { ascending: true });

      // Buscar intercorrências
      const { data: intercurrences } = await supabase
        .from('intercurrences')
        .select('*')
        .eq('resident_id', resident.id)
        .gte('occurred_at', thirtyDaysAgo.toISOString())
        .order('occurred_at', { ascending: true });

      // Buscar registros de eliminação
      const { data: eliminationRecords } = await supabase
        .from('elimination_records')
        .select('*')
        .eq('resident_id', resident.id)
        .gte('recorded_at', thirtyDaysAgo.toISOString())
        .order('recorded_at', { ascending: true });

      healthPatterns.push({
        residentId: resident.id,
        residentName: resident.name,
        vitalSigns: vitalSigns || [],
        intercurrences: intercurrences || [],
        eliminationRecords: eliminationRecords || [],
        timeframe: '30_days'
      });
    }

    return healthPatterns;
  }
}

export const aiHealthService = new AIHealthService();
