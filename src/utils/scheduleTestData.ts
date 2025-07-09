import { supabase } from '../lib/supabase';
import { Caregiver, Schedule } from '../types';

export const createTestCaregivers = async (userId: string, organizationId?: string) => {
  // Fetch the current organization_id from user_profiles if not provided
  if (!organizationId) {
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (!userProfileError && userProfile && userProfile.organization_id) {
      organizationId = userProfile.organization_id;
      console.log('Using organization_id from user profile for caregivers:', organizationId);
    } else {
      console.log('No organization_id found in user profile for caregivers, using null');
    }
  }

  const testCaregivers = [
    {
      name: 'Ana Silva',
      phone: '(11) 98765-4321',
      shift: 'morning' as const,
      specialization: ['Enfermagem', 'Cuidados Gerais'],
      status: 'active' as const,
      user_id: userId,
      organization_id: organizationId
    },
    {
      name: 'Carlos Santos',
      phone: '(11) 97654-3210',
      shift: 'afternoon' as const,
      specialization: ['Fisioterapia', 'Mobilidade'],
      status: 'active' as const,
      user_id: userId,
      organization_id: organizationId
    },
    {
      name: 'Maria Oliveira',
      phone: '(11) 96543-2109',
      shift: 'night' as const,
      specialization: ['Enfermagem', 'Emergências'],
      status: 'active' as const,
      user_id: userId,
      organization_id: organizationId
    },
    {
      name: 'João Pereira',
      phone: '(11) 95432-1098',
      shift: 'morning' as const,
      specialization: ['Cuidados Gerais', 'Recreação'],
      status: 'active' as const,
      user_id: userId,
      organization_id: organizationId
    },
    {
      name: 'Fernanda Costa',
      phone: '(11) 94321-0987',
      shift: 'afternoon' as const,
      specialization: ['Nutrição', 'Cuidados Especiais'],
      status: 'active' as const,
      user_id: userId,
      organization_id: organizationId
    }
  ];

  try {
    console.log('Creating test caregivers for user with organization_id:', organizationId);
    
    const { data, error } = await supabase
      .from('caregivers')
      .insert(testCaregivers)
      .select();

    if (error) {
      console.error('Supabase error creating test caregivers:', error);
      throw new Error(`Erro ao criar cuidadores: ${error.message}`);
    }

    console.log('Test caregivers created successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to create test caregivers:', error);
    throw error;
  }
};

export const createTestScheduleData = async (userId: string, residents: any[], existingCaregivers: Caregiver[], organizationId?: string) => {
  try {
    console.log('Starting test schedule data creation for user:', userId);
    
    // Fetch the current organization_id from user_profiles if not provided
    if (!organizationId) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .single();
      
      if (!userProfileError && userProfile && userProfile.organization_id) {
        organizationId = userProfile.organization_id;
        console.log('Using organization_id from user profile for schedule data:', organizationId);
      } else {
        console.log('No organization_id found in user profile for schedule data, using null');
      }
    }
    
    // Create caregivers if none exist
    let caregivers = existingCaregivers;
    if (caregivers.length === 0) {
      caregivers = await createTestCaregivers(userId, organizationId);
    }
    
    console.log('Complete test schedule data created successfully:', {
      caregivers: caregivers.length
    });
    
    return {
      caregivers
    };
  } catch (error) {
    console.error('Failed to create complete test schedule data:', error);
    throw error;
  }
};
