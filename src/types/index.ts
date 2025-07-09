export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'nurse' | 'caregiver' | 'coordinator';
  avatar?: string;
  organizationId?: string;
}

export interface Resident {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  admissionDate: string;
  room: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  healthStatus: 'stable' | 'attention' | 'critical';
  medications: Medication[];
  notes: string;
  monthlyFeeAmount: number;
  organizationId?: string;
  // Novos campos (serão adicionados quando a migração do banco for feita)
  dateOfBirth?: string;
  mobilityStatus?: 'walking' | 'crutches' | 'stretcher' | 'wheelchair';
  medicalDiagnosis?: string[];
  swallowingDifficulty?: boolean;
  physicalActivity?: boolean;
  consciousnessLevel?: 'lucid' | 'sleepy' | 'torporous' | 'confused';
  pressureUlcer?: boolean;
  pressureUlcerLocation?: string;
  dependencyLevels?: {
    eating: 'independent' | 'semi_dependent' | 'dependent';
    bathing: 'independent' | 'semi_dependent' | 'dependent';
    dressing: 'independent' | 'semi_dependent' | 'dependent';
    stairs: 'independent' | 'semi_dependent' | 'dependent';
    walking: 'independent' | 'semi_dependent' | 'dependent';
    bedMobility: 'independent' | 'semi_dependent' | 'dependent';
  };
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency?: string; // Agora é opcional
  time: string[];
  residentId: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
  observations?: string; // Nova propriedade
  medicalPrescriptionUrl?: string; // Nova propriedade
  organizationId?: string;
}

export interface MedicationName {
  id: string;
  name: string;
  userId: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Caregiver {
  id: string;
  name: string;
  phone: string;
  shift: 'morning' | 'afternoon' | 'night';
  specialization: string[];
  status: 'active' | 'inactive';
  organizationId?: string;
}

export interface DiaperUsage {
  id: string;
  residentId: string;
  date: string;
  quantity: number;
  shift: 'morning' | 'afternoon' | 'night';
  observations?: string;
  diaperTypeId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
}

export interface DiaperType {
  id: string;
  name: string;
  size: string;
  brand: string;
  unitCost: number;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relation: string;
  residentId: string;
  isPrimary: boolean;
  notes?: string;
  userId: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMessage {
  id: string;
  residentId: string;
  familyMemberId?: string;
  from: string;
  message: string;
  type: 'update' | 'request' | 'emergency' | 'response';
  read: boolean;
  date: string;
  parentMessageId?: string;
  userId: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

// Health Records Types
export interface VitalSigns {
  id: string;
  residentId: string;
  systolicPressure?: number;
  diastolicPressure?: number;
  oxygenSaturation?: number;
  glucose?: number;
  heartRate?: number;
  temperature?: number;
  recordedAt: string;
  observations?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
}

export interface EliminationRecord {
  id: string;
  residentId: string;
  type: 'evacuation' | 'urine';
  recordedAt: string;
  evacuationCount?: number;
  evacuationConsistency?: 'solid' | 'soft' | 'liquid' | 'hard' | 'other';
  urineVolume?: number;
  urineColor?: 'clear' | 'yellow' | 'dark_yellow' | 'amber' | 'brown' | 'red' | 'other';
  observations?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
}

export interface Intercurrence {
  id: string;
  residentId: string;
  type: 'fainting' | 'vomiting' | 'fall' | 'seizure' | 'pain' | 'breathing_difficulty' | 'skin_injury' | 'behavioral_change' | 'other';
  description: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  actionsTaken?: string;
  outcome?: string;
  occurredAt: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Database types for Supabase
export interface DatabaseResident {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  admission_date: string;
  room: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  health_status: 'stable' | 'attention' | 'critical';
  notes: string;
  monthly_fee_amount: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  organization_id?: string;
  // Novos campos (serão adicionados quando a migração do banco for feita)
  date_of_birth?: string;
  mobility_status?: string;
  medical_diagnosis?: string[];
  swallowing_difficulty?: boolean;
  physical_activity?: boolean;
  consciousness_level?: string;
  pressure_ulcer?: boolean;
  pressure_ulcer_location?: string;
  dependency_levels?: Record<string, string>;
}

export interface DatabaseMedication {
  id: string;
  name: string;
  dosage: string;
  frequency?: string; // Agora é opcional
  time_schedule: string[];
  resident_id: string;
  prescribed_by: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'paused';
  observations?: string; // Nova propriedade
  medical_prescription_url?: string; // Nova propriedade
  created_at: string;
  updated_at: string;
  user_id: string;
  organization_id?: string;
}

export interface DatabaseMedicationName {
  id: string;
  name: string;
  user_id: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCaregiver {
  id: string;
  name: string;
  phone: string;
  shift: 'morning' | 'afternoon' | 'night';
  specialization: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  user_id: string;
  organization_id?: string;
}

export interface DatabaseDiaperUsage {
  id: string;
  resident_id: string;
  date: string;
  quantity: number;
  shift: 'morning' | 'afternoon' | 'night';
  observations: string | null;
  diaper_type_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  organization_id?: string;
}

export interface DatabaseDiaperType {
  id: string;
  name: string;
  size: string;
  brand: string;
  unit_cost: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  organization_id?: string;
}

export interface DatabaseFamilyMember {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  relation: string;
  resident_id: string;
  is_primary: boolean;
  notes: string | null;
  user_id: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseFamilyMessage {
  id: string;
  resident_id: string;
  family_member_id: string | null;
  from_name: string;
  message: string;
  type: 'update' | 'request' | 'emergency' | 'response';
  read: boolean;
  created_at: string;
  updated_at: string;
  parent_message_id: string | null;
  user_id: string;
  organization_id?: string;
}

export interface DatabaseVitalSigns {
  id: string;
  resident_id: string;
  systolic_pressure: number | null;
  diastolic_pressure: number | null;
  oxygen_saturation: number | null;
  glucose: number | null;
  heart_rate: number | null;
  temperature: number | null;
  recorded_at: string;
  observations: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  organization_id?: string;
}

export interface DatabaseEliminationRecord {
  id: string;
  resident_id: string;
  type: 'evacuation' | 'urine';
  recorded_at: string;
  evacuation_count: number | null;
  evacuation_consistency: string | null;
  urine_volume: number | null;
  urine_color: string | null;
  observations: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  organization_id?: string;
}

export interface DatabaseIntercurrence {
  id: string;
  resident_id: string;
  type: string;
  description: string;
  severity: string;
  actions_taken: string | null;
  outcome: string | null;
  occurred_at: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  organization_id?: string;
}

export interface DatabaseOrganization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
