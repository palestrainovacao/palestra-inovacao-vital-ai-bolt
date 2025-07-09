export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          role: 'admin' | 'nurse' | 'caregiver' | 'coordinator';
          avatar_url: string | null;
          phone: string | null;
          settings: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          role?: 'admin' | 'nurse' | 'caregiver' | 'coordinator';
          avatar_url?: string | null;
          phone?: string | null;
          settings?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          role?: 'admin' | 'nurse' | 'caregiver' | 'coordinator';
          avatar_url?: string | null;
          phone?: string | null;
          settings?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      residents: {
        Row: {
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
        };
        Insert: {
          id?: string;
          name: string;
          age: number;
          gender: 'M' | 'F';
          admission_date?: string;
          room: string;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          emergency_contact_relation: string;
          health_status?: 'stable' | 'attention' | 'critical';
          notes?: string;
          monthly_fee_amount?: number;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          age?: number;
          gender?: 'M' | 'F';
          admission_date?: string;
          room?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relation?: string;
          health_status?: 'stable' | 'attention' | 'critical';
          notes?: string;
          monthly_fee_amount?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      medications: {
        Row: {
          id: string;
          name: string;
          dosage: string;
          frequency: string;
          time_schedule: string[];
          resident_id: string;
          prescribed_by: string;
          start_date: string;
          end_date: string | null;
          status: 'active' | 'completed' | 'paused';
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          dosage: string;
          frequency: string;
          time_schedule: string[];
          resident_id: string;
          prescribed_by: string;
          start_date?: string;
          end_date?: string | null;
          status?: 'active' | 'completed' | 'paused';
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          dosage?: string;
          frequency?: string;
          time_schedule?: string[];
          resident_id?: string;
          prescribed_by?: string;
          start_date?: string;
          end_date?: string | null;
          status?: 'active' | 'completed' | 'paused';
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      caregivers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          shift: 'morning' | 'afternoon' | 'night';
          specialization: string[];
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          shift: 'morning' | 'afternoon' | 'night';
          specialization: string[];
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          shift?: 'morning' | 'afternoon' | 'night';
          specialization?: string[];
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          caregiver_id: string;
          date: string;
          shift: 'morning' | 'afternoon' | 'night';
          residents: string[];
          status: 'scheduled' | 'completed' | 'absent';
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          caregiver_id: string;
          date: string;
          shift: 'morning' | 'afternoon' | 'night';
          residents: string[];
          status?: 'scheduled' | 'completed' | 'absent';
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          caregiver_id?: string;
          date?: string;
          shift?: 'morning' | 'afternoon' | 'night';
          residents?: string[];
          status?: 'scheduled' | 'completed' | 'absent';
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      family_members: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          relation: string;
          resident_id: string;
          is_primary: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          relation: string;
          resident_id: string;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          relation?: string;
          resident_id?: string;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      family_messages: {
        Row: {
          id: string;
          resident_id: string;
          family_member_id: string | null;
          from_name: string;
          message: string;
          type: 'update' | 'request' | 'emergency' | 'response';
          read: boolean;
          parent_message_id: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          resident_id: string;
          family_member_id?: string | null;
          from_name: string;
          message: string;
          type?: 'update' | 'request' | 'emergency' | 'response';
          read?: boolean;
          parent_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          resident_id?: string;
          family_member_id?: string | null;
          from_name?: string;
          message?: string;
          type?: 'update' | 'request' | 'emergency' | 'response';
          read?: boolean;
          parent_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      diaper_usages: {
        Row: {
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
        };
        Insert: {
          id?: string;
          resident_id: string;
          date: string;
          quantity: number;
          shift?: 'morning' | 'afternoon' | 'night';
          observations?: string | null;
          diaper_type_id?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resident_id?: string;
          date?: string;
          quantity?: number;
          shift?: 'morning' | 'afternoon' | 'night';
          observations?: string | null;
          diaper_type_id?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      diaper_types: {
        Row: {
          id: string;
          name: string;
          size: string;
          brand: string;
          unit_cost: number;
          is_active: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          size: string;
          brand: string;
          unit_cost: number;
          is_active?: boolean;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          size?: string;
          brand?: string;
          unit_cost?: number;
          is_active?: boolean;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      vital_signs: {
        Row: {
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
        };
        Insert: {
          id?: string;
          resident_id: string;
          systolic_pressure?: number | null;
          diastolic_pressure?: number | null;
          oxygen_saturation?: number | null;
          glucose?: number | null;
          heart_rate?: number | null;
          temperature?: number | null;
          recorded_at?: string;
          observations?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resident_id?: string;
          systolic_pressure?: number | null;
          diastolic_pressure?: number | null;
          oxygen_saturation?: number | null;
          glucose?: number | null;
          heart_rate?: number | null;
          temperature?: number | null;
          recorded_at?: string;
          observations?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      elimination_records: {
        Row: {
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
        };
        Insert: {
          id?: string;
          resident_id: string;
          type: 'evacuation' | 'urine';
          recorded_at?: string;
          evacuation_count?: number | null;
          evacuation_consistency?: string | null;
          urine_volume?: number | null;
          urine_color?: string | null;
          observations?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resident_id?: string;
          type?: 'evacuation' | 'urine';
          recorded_at?: string;
          evacuation_count?: number | null;
          evacuation_consistency?: string | null;
          urine_volume?: number | null;
          urine_color?: string | null;
          observations?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      intercurrences: {
        Row: {
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
        };
        Insert: {
          id?: string;
          resident_id: string;
          type: string;
          description: string;
          severity: string;
          actions_taken?: string | null;
          outcome?: string | null;
          occurred_at?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resident_id?: string;
          type?: string;
          description?: string;
          severity?: string;
          actions_taken?: string | null;
          outcome?: string | null;
          occurred_at?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
