import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, getMedicationNames, insertMedicationName } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { 
  Resident, 
  Medication, 
  Caregiver, 
  DiaperUsage,
  DiaperType,
  MedicationName,
  FamilyMember,
  FamilyMessage,
  DatabaseResident,
  DatabaseMedication,
  DatabaseCaregiver,
  DatabaseDiaperUsage,
  DatabaseDiaperType,
  DatabaseMedicationName,
  DatabaseFamilyMember,
  DatabaseFamilyMessage
} from '../types';

interface AppContextType {
  residents: Resident[];
  medications: Medication[];
  caregivers: Caregiver[];
  diaperUsages: DiaperUsage[];
  diaperTypes: DiaperType[];
  medicationNames: MedicationName[];
  familyMembers: FamilyMember[];
  familyMessages: FamilyMessage[];
  addResident: (resident: Omit<Resident, 'id'>) => Promise<void>;
  updateResident: (id: string, resident: Partial<Resident>) => Promise<void>;
  deleteResident: (id: string) => Promise<void>;
  addMedication: (medication: Omit<Medication, 'id'>) => Promise<void>;
  updateMedication: (id: string, medication: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  addMedicationName: (name: string) => Promise<void>;
  addCaregiver: (caregiver: Omit<Caregiver, 'id'>) => Promise<void>;
  updateCaregiver: (id: string, caregiver: Partial<Caregiver>) => Promise<void>;
  deleteCaregiver: (id: string) => Promise<void>;
  addDiaperUsage: (usage: Omit<DiaperUsage, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDiaperUsage: (id: string, usage: Partial<DiaperUsage>) => Promise<void>;
  deleteDiaperUsage: (id: string) => Promise<void>;
  addDiaperType: (type: Omit<DiaperType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDiaperType: (id: string, type: Partial<DiaperType>) => Promise<void>;
  deleteDiaperType: (id: string) => Promise<void>;
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFamilyMember: (id: string, member: Partial<FamilyMember>) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;
  addFamilyMessage: (message: Omit<FamilyMessage, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFamilyMessage: (id: string, message: Partial<FamilyMessage>) => Promise<void>;
  deleteFamilyMessage: (id: string) => Promise<void>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  migrateResidentsToOrganization: () => Promise<{success: boolean, count: number, error?: string}>;
  hasResidentsWithoutOrganization: boolean;
  connectionError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

// Helper functions to transform database objects to app objects
const transformResident = (dbResident: DatabaseResident): Resident => ({
  id: dbResident.id,
  name: dbResident.name,
  age: dbResident.age,
  gender: dbResident.gender,
  admissionDate: dbResident.admission_date,
  room: dbResident.room,
  emergencyContact: {
    name: dbResident.emergency_contact_name,
    phone: dbResident.emergency_contact_phone,
    relation: dbResident.emergency_contact_relation,
  },
  healthStatus: dbResident.health_status,
  notes: dbResident.notes,
  monthlyFeeAmount: dbResident.monthly_fee_amount,
  medications: [], // Will be populated separately
  organizationId: dbResident.organization_id,
});

const transformMedication = (dbMedication: DatabaseMedication): Medication => ({
  id: dbMedication.id,
  name: dbMedication.name,
  dosage: dbMedication.dosage,
  frequency: dbMedication.frequency,
  time: dbMedication.time_schedule,
  residentId: dbMedication.resident_id,
  prescribedBy: dbMedication.prescribed_by,
  startDate: dbMedication.start_date,
  endDate: dbMedication.end_date || undefined,
  status: dbMedication.status,
  observations: dbMedication.observations || undefined,
  medicalPrescriptionUrl: dbMedication.medical_prescription_url || undefined,
  organizationId: dbMedication.organization_id,
});

const transformMedicationName = (dbMedicationName: DatabaseMedicationName): MedicationName => ({
  id: dbMedicationName.id,
  name: dbMedicationName.name,
  userId: dbMedicationName.user_id,
  organizationId: dbMedicationName.organization_id,
  createdAt: dbMedicationName.created_at,
  updatedAt: dbMedicationName.updated_at,
});

const transformCaregiver = (dbCaregiver: DatabaseCaregiver): Caregiver => ({
  id: dbCaregiver.id,
  name: dbCaregiver.name,
  phone: dbCaregiver.phone,
  shift: dbCaregiver.shift,
  specialization: dbCaregiver.specialization,
  status: dbCaregiver.status,
  organizationId: dbCaregiver.organization_id,
});

const transformDiaperUsage = (dbUsage: DatabaseDiaperUsage): DiaperUsage => ({
  id: dbUsage.id,
  residentId: dbUsage.resident_id,
  date: dbUsage.date,
  quantity: dbUsage.quantity,
  shift: dbUsage.shift,
  observations: dbUsage.observations || undefined,
  diaperTypeId: dbUsage.diaper_type_id || undefined,
  userId: dbUsage.user_id,
  createdAt: dbUsage.created_at,
  updatedAt: dbUsage.updated_at,
  organizationId: dbUsage.organization_id,
});

const transformDiaperType = (dbType: DatabaseDiaperType): DiaperType => ({
  id: dbType.id,
  name: dbType.name,
  size: dbType.size,
  brand: dbType.brand,
  unitCost: dbType.unit_cost,
  isActive: dbType.is_active,
  userId: dbType.user_id,
  createdAt: dbType.created_at,
  updatedAt: dbType.updated_at,
  organizationId: dbType.organization_id,
});

const transformFamilyMember = (dbMember: DatabaseFamilyMember): FamilyMember => ({
  id: dbMember.id,
  name: dbMember.name,
  phone: dbMember.phone,
  email: dbMember.email || undefined,
  relation: dbMember.relation,
  residentId: dbMember.resident_id,
  isPrimary: dbMember.is_primary,
  notes: dbMember.notes || undefined,
  userId: dbMember.user_id,
  organizationId: dbMember.organization_id,
  createdAt: dbMember.created_at,
  updatedAt: dbMember.updated_at,
});

const transformFamilyMessage = (dbMessage: DatabaseFamilyMessage): FamilyMessage => ({
  id: dbMessage.id,
  residentId: dbMessage.resident_id,
  familyMemberId: dbMessage.family_member_id || undefined,
  from: dbMessage.from_name,
  message: dbMessage.message,
  type: dbMessage.type,
  read: dbMessage.read,
  date: dbMessage.created_at,
  parentMessageId: dbMessage.parent_message_id || undefined,
  userId: dbMessage.user_id,
  organizationId: dbMessage.organization_id,
  createdAt: dbMessage.created_at,
  updatedAt: dbMessage.updated_at,
});

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationNames, setMedicationNames] = useState<MedicationName[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [diaperUsages, setDiaperUsages] = useState<DiaperUsage[]>([]);
  const [diaperTypes, setDiaperTypes] = useState<DiaperType[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyMessages, setFamilyMessages] = useState<FamilyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasResidentsWithoutOrganization, setHasResidentsWithoutOrganization] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Load data when user is available
  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      // Clear data when user logs out
      setResidents([]);
      setMedications([]);
      setMedicationNames([]);
      setCaregivers([]);
      setDiaperUsages([]);
      setDiaperTypes([]);
      setFamilyMembers([]);
      setFamilyMessages([]);
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
      setConnectionError(`Erro ao carregar dados: ${error.message}`);
    }
  };

  const refreshData = async () => {
    if (!user) return;

    setIsLoading(true);
    setConnectionError(null);
    
    try {
      await Promise.all([
        loadResidents(),
        loadMedications(),
        loadMedicationNames(),
        loadCaregivers(),
        loadDiaperUsages(),
        loadDiaperTypes(),
        loadFamilyMembers(),
        loadFamilyMessages(),
      ]);
    } catch (error) {
      handleError(error, 'refreshData');
    } finally {
      setIsLoading(false);
    }
  };

  const loadResidents = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('residents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedResidents = data.map(transformResident);
      setResidents(transformedResidents);

      // Check if there are residents without organization_id
      if (user.organizationId) {
        const { data: residentsWithoutOrg, error: checkError } = await supabase
          .from('residents')
          .select('id')
          .eq('user_id', user.id)
          .is('organization_id', null);
        
        if (!checkError && residentsWithoutOrg && residentsWithoutOrg.length > 0) {
          setHasResidentsWithoutOrganization(true);
        } else {
          setHasResidentsWithoutOrganization(false);
        }
      }
    } catch (error) {
      handleError(error, 'loadResidents');
    }
  };

  const loadFamilyMembers = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedMembers = data.map(transformFamilyMember);
      setFamilyMembers(transformedMembers);
    } catch (error) {
      handleError(error, 'loadFamilyMembers');
    }
  };

  const loadFamilyMessages = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('family_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedMessages = data.map(transformFamilyMessage);
      setFamilyMessages(transformedMessages);
    } catch (error) {
      handleError(error, 'loadFamilyMessages');
    }
  };

  const migrateResidentsToOrganization = async () => {
    if (!user || !user.organizationId) {
      return { success: false, count: 0, error: 'Usuário não está associado a uma organização' };
    }

    try {
      // Find all residents for this user with null organization_id
      const { data: residentsToMigrate, error: findError } = await supabase
        .from('residents')
        .select('id')
        .eq('user_id', user.id)
        .is('organization_id', null);

      if (findError) {
        console.error('Error finding residents to migrate:', findError);
        return { success: false, count: 0, error: findError.message };
      }

      if (!residentsToMigrate || residentsToMigrate.length === 0) {
        return { success: true, count: 0 };
      }

      // Update all found residents with the user's organization_id
      const { data: updatedData, error: updateError } = await supabase
        .from('residents')
        .update({ organization_id: user.organizationId })
        .eq('user_id', user.id)
        .is('organization_id', null)
        .select();

      if (updateError) {
        console.error('Error updating residents:', updateError);
        return { success: false, count: 0, error: updateError.message };
      }

      // Refresh the residents data
      await loadResidents();

      return { 
        success: true, 
        count: residentsToMigrate.length 
      };
    } catch (error) {
      console.error('Error in migrateResidentsToOrganization:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  };

  const loadMedications = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedMedications = data.map(transformMedication);
      setMedications(transformedMedications);
    } catch (error) {
      handleError(error, 'loadMedications');
    }
  };

  const loadMedicationNames = async () => {
    if (!user) return;

    try {
      const data = await getMedicationNames(user.organizationId);
      const transformedNames = data.map(transformMedicationName);
      setMedicationNames(transformedNames);
    } catch (error) {
      handleError(error, 'loadMedicationNames');
    }
  };

  const loadCaregivers = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('caregivers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedCaregivers = data.map(transformCaregiver);
      setCaregivers(transformedCaregivers);
    } catch (error) {
      handleError(error, 'loadCaregivers');
    }
  };

  const loadDiaperUsages = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('diaper_usages')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedUsages = data.map(transformDiaperUsage);
      setDiaperUsages(transformedUsages);
    } catch (error) {
      handleError(error, 'loadDiaperUsages');
    }
  };

  const loadDiaperTypes = async () => {
    if (!user) return;

    try {
      // Only load diaper types for admins
      if (user.role !== 'admin') {
        setDiaperTypes([]);
        return;
      }

      let query = supabase
        .from('diaper_types')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedTypes = data.map(transformDiaperType);
      setDiaperTypes(transformedTypes);
    } catch (error) {
      handleError(error, 'loadDiaperTypes');
    }
  };

  const addResident = async (resident: Omit<Resident, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('residents')
      .insert({
        name: resident.name,
        age: resident.age,
        gender: resident.gender,
        admission_date: resident.admissionDate,
        room: resident.room,
        emergency_contact_name: resident.emergencyContact.name,
        emergency_contact_phone: resident.emergencyContact.phone,
        emergency_contact_relation: resident.emergencyContact.relation,
        health_status: resident.healthStatus,
        notes: resident.notes,
        monthly_fee_amount: resident.monthlyFeeAmount,
        user_id: user.id,
        organization_id: user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding resident:', error);
      throw error;
    }

    const newResident = transformResident(data);
    setResidents(prev => [newResident, ...prev]);
  };

  const updateResident = async (id: string, updates: Partial<Resident>) => {
    if (!user) return;

    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.age) updateData.age = updates.age;
    if (updates.gender) updateData.gender = updates.gender;
    if (updates.admissionDate) updateData.admission_date = updates.admissionDate;
    if (updates.room) updateData.room = updates.room;
    if (updates.emergencyContact) {
      updateData.emergency_contact_name = updates.emergencyContact.name;
      updateData.emergency_contact_phone = updates.emergencyContact.phone;
      updateData.emergency_contact_relation = updates.emergencyContact.relation;
    }
    if (updates.healthStatus) updateData.health_status = updates.healthStatus;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.monthlyFeeAmount !== undefined) updateData.monthly_fee_amount = updates.monthlyFeeAmount;

    let query = supabase
      .from('residents')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating resident:', error);
      throw error;
    }

    const updatedResident = transformResident(data);
    setResidents(prev => prev.map(r => r.id === id ? updatedResident : r));
  };

  const deleteResident = async (id: string) => {
    if (!user) return;

    let query = supabase
      .from('residents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting resident:', error);
      throw error;
    }

    setResidents(prev => prev.filter(r => r.id !== id));
  };

  const addMedication = async (medication: Omit<Medication, 'id'>) => {
    if (!user) return;

    // Check if medication name exists, if not add it
    if (medication.name && !medicationNames.some(m => m.name === medication.name)) {
      await addMedicationName(medication.name);
    }

    const { data, error } = await supabase
      .from('medications')
      .insert({
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        time_schedule: medication.time,
        resident_id: medication.residentId,
        prescribed_by: medication.prescribedBy,
        start_date: medication.startDate,
        end_date: medication.endDate || null,
        status: medication.status,
        observations: medication.observations || null,
        medical_prescription_url: medication.medicalPrescriptionUrl || null,
        user_id: user.id,
        organization_id: user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding medication:', error);
      throw error;
    }

    const newMedication = transformMedication(data);
    setMedications(prev => [newMedication, ...prev]);
  };

  const updateMedication = async (id: string, updates: Partial<Medication>) => {
    if (!user) return;

    // Check if medication name exists, if not add it
    if (updates.name && !medicationNames.some(m => m.name === updates.name)) {
      await addMedicationName(updates.name);
    }

    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.dosage) updateData.dosage = updates.dosage;
    if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
    if (updates.time) updateData.time_schedule = updates.time;
    if (updates.residentId) updateData.resident_id = updates.residentId;
    if (updates.prescribedBy) updateData.prescribed_by = updates.prescribedBy;
    if (updates.startDate) updateData.start_date = updates.startDate;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
    if (updates.status) updateData.status = updates.status;
    if (updates.observations !== undefined) updateData.observations = updates.observations;
    if (updates.medicalPrescriptionUrl !== undefined) updateData.medical_prescription_url = updates.medicalPrescriptionUrl;

    let query = supabase
      .from('medications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating medication:', error);
      throw error;
    }

    const updatedMedication = transformMedication(data);
    setMedications(prev => prev.map(m => m.id === id ? updatedMedication : m));
  };

  const deleteMedication = async (id: string) => {
    if (!user) return;

    let query = supabase
      .from('medications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }

    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const addMedicationName = async (name: string) => {
    if (!user) return;

    try {
      const result = await insertMedicationName(name, user.id, user.organizationId);
      
      if (result) {
        const newMedicationName = transformMedicationName(result);
        setMedicationNames(prev => [newMedicationName, ...prev]);
      }
    } catch (error) {
      console.error('Error adding medication name:', error);
      // Don't throw error here, as this is a secondary operation
    }
  };

  const addCaregiver = async (caregiver: Omit<Caregiver, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('caregivers')
      .insert({
        name: caregiver.name,
        phone: caregiver.phone,
        shift: caregiver.shift,
        specialization: caregiver.specialization,
        status: caregiver.status,
        user_id: user.id,
        organization_id: user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding caregiver:', error);
      throw error;
    }

    const newCaregiver = transformCaregiver(data);
    setCaregivers(prev => [newCaregiver, ...prev]);
  };

  const updateCaregiver = async (id: string, updates: Partial<Caregiver>) => {
    if (!user) return;

    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.shift) updateData.shift = updates.shift;
    if (updates.specialization) updateData.specialization = updates.specialization;
    if (updates.status) updateData.status = updates.status;

    let query = supabase
      .from('caregivers')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating caregiver:', error);
      throw error;
    }

    const updatedCaregiver = transformCaregiver(data);
    setCaregivers(prev => prev.map(c => c.id === id ? updatedCaregiver : c));
  };

  const deleteCaregiver = async (id: string) => {
    if (!user) return;

    let query = supabase
      .from('caregivers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting caregiver:', error);
      throw error;
    }

    setCaregivers(prev => prev.filter(c => c.id !== id));
  };

  const addDiaperUsage = async (usage: Omit<DiaperUsage, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('diaper_usages')
      .insert({
        resident_id: usage.residentId,
        date: usage.date,
        quantity: usage.quantity,
        shift: usage.shift,
        observations: usage.observations || null,
        diaper_type_id: usage.diaperTypeId || null,
        user_id: user.id,
        organization_id: user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding diaper usage:', error);
      throw error;
    }

    const newUsage = transformDiaperUsage(data);
    setDiaperUsages(prev => [newUsage, ...prev]);
  };

  const updateDiaperUsage = async (id: string, updates: Partial<DiaperUsage>) => {
    if (!user) return;

    const updateData: any = {};
    
    if (updates.residentId) updateData.resident_id = updates.residentId;
    if (updates.date) updateData.date = updates.date;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.shift) updateData.shift = updates.shift;
    if (updates.observations !== undefined) updateData.observations = updates.observations;
    if (updates.diaperTypeId !== undefined) updateData.diaper_type_id = updates.diaperTypeId;

    let query = supabase
      .from('diaper_usages')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating diaper usage:', error);
      throw error;
    }

    const updatedUsage = transformDiaperUsage(data);
    setDiaperUsages(prev => prev.map(u => u.id === id ? updatedUsage : u));
  };

  const deleteDiaperUsage = async (id: string) => {
    if (!user) return;

    let query = supabase
      .from('diaper_usages')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting diaper usage:', error);
      throw error;
    }

    setDiaperUsages(prev => prev.filter(u => u.id !== id));
  };

  const addDiaperType = async (type: Omit<DiaperType, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || user.role !== 'admin') return;

    const { data, error } = await supabase
      .from('diaper_types')
      .insert({
        name: type.name,
        size: type.size,
        brand: type.brand,
        unit_cost: type.unitCost,
        is_active: type.isActive,
        user_id: user.id,
        organization_id: user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding diaper type:', error);
      throw error;
    }

    const newType = transformDiaperType(data);
    setDiaperTypes(prev => [newType, ...prev]);
  };

  const updateDiaperType = async (id: string, updates: Partial<DiaperType>) => {
    if (!user || user.role !== 'admin') return;

    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.size) updateData.size = updates.size;
    if (updates.brand) updateData.brand = updates.brand;
    if (updates.unitCost !== undefined) updateData.unit_cost = updates.unitCost;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    let query = supabase
      .from('diaper_types')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating diaper type:', error);
      throw error;
    }

    const updatedType = transformDiaperType(data);
    setDiaperTypes(prev => prev.map(t => t.id === id ? updatedType : t));
  };

  const deleteDiaperType = async (id: string) => {
    if (!user || user.role !== 'admin') return;

    let query = supabase
      .from('diaper_types')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting diaper type:', error);
      throw error;
    }

    setDiaperTypes(prev => prev.filter(t => t.id !== id));
  };

  const addFamilyMember = async (member: Omit<FamilyMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('family_members')
      .insert({
        name: member.name,
        phone: member.phone,
        email: member.email || null,
        relation: member.relation,
        resident_id: member.residentId,
        is_primary: member.isPrimary,
        notes: member.notes || null,
        user_id: user.id,
        organization_id: user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding family member:', error);
      throw error;
    }

    const newMember = transformFamilyMember(data);
    setFamilyMembers(prev => [newMember, ...prev]);
  };

  const updateFamilyMember = async (id: string, updates: Partial<FamilyMember>) => {
    if (!user) return;

    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.relation) updateData.relation = updates.relation;
    if (updates.residentId) updateData.resident_id = updates.residentId;
    if (updates.isPrimary !== undefined) updateData.is_primary = updates.isPrimary;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    let query = supabase
      .from('family_members')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating family member:', error);
      throw error;
    }

    const updatedMember = transformFamilyMember(data);
    setFamilyMembers(prev => prev.map(m => m.id === id ? updatedMember : m));
  };

  const deleteFamilyMember = async (id: string) => {
    if (!user) return;

    let query = supabase
      .from('family_members')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting family member:', error);
      throw error;
    }

    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  const addFamilyMessage = async (message: Omit<FamilyMessage, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('family_messages')
      .insert({
        resident_id: message.residentId,
        family_member_id: message.familyMemberId || null,
        from_name: message.from,
        message: message.message,
        type: message.type,
        read: message.read,
        parent_message_id: message.parentMessageId || null,
        user_id: user.id,
        organization_id: user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding family message:', error);
      throw error;
    }

    const newMessage = transformFamilyMessage(data);
    setFamilyMessages(prev => [newMessage, ...prev]);
  };

  const updateFamilyMessage = async (id: string, updates: Partial<FamilyMessage>) => {
    if (!user) return;

    const updateData: any = {};
    
    if (updates.residentId) updateData.resident_id = updates.residentId;
    if (updates.familyMemberId !== undefined) updateData.family_member_id = updates.familyMemberId;
    if (updates.from) updateData.from_name = updates.from;
    if (updates.message) updateData.message = updates.message;
    if (updates.type) updateData.type = updates.type;
    if (updates.read !== undefined) updateData.read = updates.read;
    if (updates.parentMessageId !== undefined) updateData.parent_message_id = updates.parentMessageId;

    let query = supabase
      .from('family_messages')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating family message:', error);
      throw error;
    }

    const updatedMessage = transformFamilyMessage(data);
    setFamilyMessages(prev => prev.map(m => m.id === id ? updatedMessage : m));
  };

  const deleteFamilyMessage = async (id: string) => {
    if (!user) return;

    let query = supabase
      .from('family_messages')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting family message:', error);
      throw error;
    }

    setFamilyMessages(prev => prev.filter(m => m.id !== id));
  };

  return (
    <AppContext.Provider value={{
      residents,
      medications,
      medicationNames,
      caregivers,
      diaperUsages,
      diaperTypes,
      familyMembers,
      familyMessages,
      addResident,
      updateResident,
      deleteResident,
      addMedication,
      updateMedication,
      deleteMedication,
      addMedicationName,
      addCaregiver,
      updateCaregiver,
      deleteCaregiver,
      addDiaperUsage,
      updateDiaperUsage,
      deleteDiaperUsage,
      addDiaperType,
      updateDiaperType,
      deleteDiaperType,
      addFamilyMember,
      updateFamilyMember,
      deleteFamilyMember,
      addFamilyMessage,
      updateFamilyMessage,
      deleteFamilyMessage,
      isLoading,
      refreshData,
      migrateResidentsToOrganization,
      hasResidentsWithoutOrganization,
      connectionError
    }}>
      {children}
    </AppContext.Provider>
  );
};
