import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  });
  throw new Error('Missing Supabase environment variables');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

// Helper function to get current user with error handling
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

// Helper function to get user profile with error handling
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Helper function to get organizations with error handling
export const getOrganizations = async () => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error getting organizations:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error getting organizations:', error);
    throw error;
  }
};

// Helper function to create an organization with error handling
export const createOrganization = async (name: string) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

// Helper function to get medication names for autocomplete with error handling
export const getMedicationNames = async (organizationId?: string) => {
  try {
    let query = supabase
      .from('medication_names')
      .select('*')
      .order('name');
    
    if (organizationId) {
      query = query.or(`organization_id.is.null,organization_id.eq.${organizationId}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting medication names:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error getting medication names:', error);
    throw error;
  }
};

// Helper function to insert a new medication name with error handling
export const insertMedicationName = async (name: string, userId: string, organizationId?: string) => {
  try {
    const { data, error } = await supabase
      .from('medication_names')
      .insert({ 
        name, 
        user_id: userId,
        organization_id: organizationId 
      })
      .select()
      .single();
    
    if (error) {
      // If the error is a unique constraint violation, it means the name already exists
      if (error.code === '23505') {
        console.log('Medication name already exists:', name);
        return null;
      }
      console.error('Error inserting medication name:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error inserting medication name:', error);
    throw error;
  }
};

// Initialize connection test on module load
if (import.meta.env.DEV) {
  testConnection().then(success => {
    if (!success) {
      console.warn('Supabase connection test failed. Please check your configuration.');
    }
  });
}
