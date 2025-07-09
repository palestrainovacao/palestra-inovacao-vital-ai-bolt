import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { 
  VitalSigns, 
  EliminationRecord, 
  Intercurrence,
  DatabaseVitalSigns,
  DatabaseEliminationRecord,
  DatabaseIntercurrence
} from '../types';

interface HealthContextType {
  vitalSigns: VitalSigns[];
  eliminationRecords: EliminationRecord[];
  intercurrences: Intercurrence[];
  addVitalSigns: (signs: Omit<VitalSigns, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVitalSigns: (id: string, signs: Partial<VitalSigns>) => Promise<void>;
  deleteVitalSigns: (id: string) => Promise<void>;
  addEliminationRecord: (record: Omit<EliminationRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEliminationRecord: (id: string, record: Partial<EliminationRecord>) => Promise<void>;
  deleteEliminationRecord: (id: string) => Promise<void>;
  addIntercurrence: (intercurrence: Omit<Intercurrence, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIntercurrence: (id: string, intercurrence: Partial<Intercurrence>) => Promise<void>;
  deleteIntercurrence: (id: string) => Promise<void>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  connectionError: string | null;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (context === undefined) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};

interface HealthProviderProps {
  children: ReactNode;
}

// Transform functions
const transformVitalSigns = (dbSigns: DatabaseVitalSigns): VitalSigns => ({
  id: dbSigns.id,
  residentId: dbSigns.resident_id,
  systolicPressure: dbSigns.systolic_pressure || undefined,
  diastolicPressure: dbSigns.diastolic_pressure || undefined,
  oxygenSaturation: dbSigns.oxygen_saturation || undefined,
  glucose: dbSigns.glucose || undefined,
  heartRate: dbSigns.heart_rate || undefined,
  temperature: dbSigns.temperature || undefined,
  recordedAt: dbSigns.recorded_at,
  observations: dbSigns.observations || undefined,
  userId: dbSigns.user_id,
  createdAt: dbSigns.created_at,
  updatedAt: dbSigns.updated_at,
  organizationId: dbSigns.organization_id,
});

const transformEliminationRecord = (dbRecord: DatabaseEliminationRecord): EliminationRecord => ({
  id: dbRecord.id,
  residentId: dbRecord.resident_id,
  type: dbRecord.type,
  recordedAt: dbRecord.recorded_at,
  evacuationCount: dbRecord.evacuation_count || undefined,
  evacuationConsistency: dbRecord.evacuation_consistency as EliminationRecord['evacuationConsistency'] || undefined,
  urineVolume: dbRecord.urine_volume || undefined,
  urineColor: dbRecord.urine_color as EliminationRecord['urineColor'] || undefined,
  observations: dbRecord.observations || undefined,
  userId: dbRecord.user_id,
  createdAt: dbRecord.created_at,
  updatedAt: dbRecord.updated_at,
  organizationId: dbRecord.organization_id,
});

const transformIntercurrence = (dbIntercurrence: DatabaseIntercurrence): Intercurrence => ({
  id: dbIntercurrence.id,
  residentId: dbIntercurrence.resident_id,
  type: dbIntercurrence.type as Intercurrence['type'],
  description: dbIntercurrence.description,
  severity: dbIntercurrence.severity as Intercurrence['severity'],
  actionsTaken: dbIntercurrence.actions_taken || undefined,
  outcome: dbIntercurrence.outcome || undefined,
  occurredAt: dbIntercurrence.occurred_at,
  userId: dbIntercurrence.user_id,
  createdAt: dbIntercurrence.created_at,
  updatedAt: dbIntercurrence.updated_at,
  organizationId: dbIntercurrence.organization_id,
});

export const HealthProvider: React.FC<HealthProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [eliminationRecords, setEliminationRecords] = useState<EliminationRecord[]>([]);
  const [intercurrences, setIntercurrences] = useState<Intercurrence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setVitalSigns([]);
      setEliminationRecords([]);
      setIntercurrences([]);
      setConnectionError(null);
    }
  }, [user]);

  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    
    // Check for network-related errors
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('NetworkError') ||
        error.message?.includes('fetch')) {
      setConnectionError('Erro de conexão com o servidor. Verifique sua conexão com a internet.');
    } else if (error.code === 'PGRST301') {
      setConnectionError('Erro de autenticação. Faça login novamente.');
    } else {
      setConnectionError(`Erro ao carregar dados de saúde: ${error.message}`);
    }
  };

  const refreshData = async () => {
    if (!user) return;

    setIsLoading(true);
    setConnectionError(null);
    
    try {
      await Promise.all([
        loadVitalSigns(),
        loadEliminationRecords(),
        loadIntercurrences(),
      ]);
    } catch (error) {
      handleError(error, 'refreshData');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVitalSigns = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('vital_signs')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedSigns = data.map(transformVitalSigns);
      setVitalSigns(transformedSigns);
    } catch (error) {
      handleError(error, 'loadVitalSigns');
    }
  };

  const loadEliminationRecords = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('elimination_records')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedRecords = data.map(transformEliminationRecord);
      setEliminationRecords(transformedRecords);
    } catch (error) {
      handleError(error, 'loadEliminationRecords');
    }
  };

  const loadIntercurrences = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('intercurrences')
        .select('*')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedIntercurrences = data.map(transformIntercurrence);
      setIntercurrences(transformedIntercurrences);
    } catch (error) {
      handleError(error, 'loadIntercurrences');
    }
  };

  // CRUD operations for Vital Signs
  const addVitalSigns = async (signs: Omit<VitalSigns, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .insert({
          resident_id: signs.residentId,
          systolic_pressure: signs.systolicPressure || null,
          diastolic_pressure: signs.diastolicPressure || null,
          oxygen_saturation: signs.oxygenSaturation || null,
          glucose: signs.glucose || null,
          heart_rate: signs.heartRate || null,
          temperature: signs.temperature || null,
          recorded_at: signs.recordedAt,
          observations: signs.observations || null,
          user_id: user.id,
          organization_id: user.organizationId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newSigns = transformVitalSigns(data);
      setVitalSigns(prev => [newSigns, ...prev]);
    } catch (error) {
      handleError(error, 'addVitalSigns');
      throw error;
    }
  };

  const updateVitalSigns = async (id: string, updates: Partial<VitalSigns>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (updates.residentId) updateData.resident_id = updates.residentId;
      if (updates.systolicPressure !== undefined) updateData.systolic_pressure = updates.systolicPressure;
      if (updates.diastolicPressure !== undefined) updateData.diastolic_pressure = updates.diastolicPressure;
      if (updates.oxygenSaturation !== undefined) updateData.oxygen_saturation = updates.oxygenSaturation;
      if (updates.glucose !== undefined) updateData.glucose = updates.glucose;
      if (updates.heartRate !== undefined) updateData.heart_rate = updates.heartRate;
      if (updates.temperature !== undefined) updateData.temperature = updates.temperature;
      if (updates.recordedAt) updateData.recorded_at = updates.recordedAt;
      if (updates.observations !== undefined) updateData.observations = updates.observations;

      let query = supabase
        .from('vital_signs')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query.select().single();

      if (error) {
        throw error;
      }

      const updatedSigns = transformVitalSigns(data);
      setVitalSigns(prev => prev.map(s => s.id === id ? updatedSigns : s));
    } catch (error) {
      handleError(error, 'updateVitalSigns');
      throw error;
    }
  };

  const deleteVitalSigns = async (id: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('vital_signs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      setVitalSigns(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      handleError(error, 'deleteVitalSigns');
      throw error;
    }
  };

  // CRUD operations for Elimination Records
  const addEliminationRecord = async (record: Omit<EliminationRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('elimination_records')
        .insert({
          resident_id: record.residentId,
          type: record.type,
          recorded_at: record.recordedAt,
          evacuation_count: record.evacuationCount || null,
          evacuation_consistency: record.evacuationConsistency || null,
          urine_volume: record.urineVolume || null,
          urine_color: record.urineColor || null,
          observations: record.observations || null,
          user_id: user.id,
          organization_id: user.organizationId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newRecord = transformEliminationRecord(data);
      setEliminationRecords(prev => [newRecord, ...prev]);
    } catch (error) {
      handleError(error, 'addEliminationRecord');
      throw error;
    }
  };

  const updateEliminationRecord = async (id: string, updates: Partial<EliminationRecord>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (updates.residentId) updateData.resident_id = updates.residentId;
      if (updates.type) updateData.type = updates.type;
      if (updates.recordedAt) updateData.recorded_at = updates.recordedAt;
      if (updates.evacuationCount !== undefined) updateData.evacuation_count = updates.evacuationCount;
      if (updates.evacuationConsistency !== undefined) updateData.evacuation_consistency = updates.evacuationConsistency;
      if (updates.urineVolume !== undefined) updateData.urine_volume = updates.urineVolume;
      if (updates.urineColor !== undefined) updateData.urine_color = updates.urineColor;
      if (updates.observations !== undefined) updateData.observations = updates.observations;

      let query = supabase
        .from('elimination_records')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query.select().single();

      if (error) {
        throw error;
      }

      const updatedRecord = transformEliminationRecord(data);
      setEliminationRecords(prev => prev.map(r => r.id === id ? updatedRecord : r));
    } catch (error) {
      handleError(error, 'updateEliminationRecord');
      throw error;
    }
  };

  const deleteEliminationRecord = async (id: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('elimination_records')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      setEliminationRecords(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      handleError(error, 'deleteEliminationRecord');
      throw error;
    }
  };

  // CRUD operations for Intercurrences
  const addIntercurrence = async (intercurrence: Omit<Intercurrence, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('intercurrences')
        .insert({
          resident_id: intercurrence.residentId,
          type: intercurrence.type,
          description: intercurrence.description,
          severity: intercurrence.severity,
          actions_taken: intercurrence.actionsTaken || null,
          outcome: intercurrence.outcome || null,
          occurred_at: intercurrence.occurredAt,
          user_id: user.id,
          organization_id: user.organizationId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newIntercurrence = transformIntercurrence(data);
      setIntercurrences(prev => [newIntercurrence, ...prev]);
    } catch (error) {
      handleError(error, 'addIntercurrence');
      throw error;
    }
  };

  const updateIntercurrence = async (id: string, updates: Partial<Intercurrence>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (updates.residentId) updateData.resident_id = updates.residentId;
      if (updates.type) updateData.type = updates.type;
      if (updates.description) updateData.description = updates.description;
      if (updates.severity) updateData.severity = updates.severity;
      if (updates.actionsTaken !== undefined) updateData.actions_taken = updates.actionsTaken;
      if (updates.outcome !== undefined) updateData.outcome = updates.outcome;
      if (updates.occurredAt) updateData.occurred_at = updates.occurredAt;

      let query = supabase
        .from('intercurrences')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query.select().single();

      if (error) {
        throw error;
      }

      const updatedIntercurrence = transformIntercurrence(data);
      setIntercurrences(prev => prev.map(i => i.id === id ? updatedIntercurrence : i));
    } catch (error) {
      handleError(error, 'updateIntercurrence');
      throw error;
    }
  };

  const deleteIntercurrence = async (id: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('intercurrences')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      setIntercurrences(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      handleError(error, 'deleteIntercurrence');
      throw error;
    }
  };

  return (
    <HealthContext.Provider value={{
      vitalSigns,
      eliminationRecords,
      intercurrences,
      addVitalSigns,
      updateVitalSigns,
      deleteVitalSigns,
      addEliminationRecord,
      updateEliminationRecord,
      deleteEliminationRecord,
      addIntercurrence,
      updateIntercurrence,
      deleteIntercurrence,
      isLoading,
      refreshData,
      connectionError
    }}>
      {children}
    </HealthContext.Provider>
  );
};
