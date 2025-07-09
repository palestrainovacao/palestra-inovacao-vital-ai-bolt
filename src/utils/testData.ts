import { supabase } from '../lib/supabase';

export const createTestResidents = async (userId: string, organizationId?: string) => {
  try {
    console.log('Creating test residents for user:', userId);
    
    // Fetch the current organization_id from user_profiles if not provided
    if (!organizationId) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .single();
      
      if (!userProfileError && userProfile && userProfile.organization_id) {
        organizationId = userProfile.organization_id;
        console.log('Using organization_id from user profile:', organizationId);
      } else {
        console.log('No organization_id found in user profile, using null');
      }
    }

    const testResidents = [
      {
        name: 'Maria das Graças Silva',
        age: 78,
        gender: 'F' as const,
        admission_date: '2023-03-15',
        room: '101',
        emergency_contact_name: 'João Carlos Silva',
        emergency_contact_phone: '(11) 98765-4321',
        emergency_contact_relation: 'Filho',
        health_status: 'stable' as const,
        notes: 'Paciente com diabetes controlada. Gosta de atividades de artesanato e leitura. Toma medicação para pressão alta às 8h e 20h. Prefere jantar mais cedo, por volta das 18h.',
        monthly_fee_amount: 2800.00,
        user_id: userId,
        organization_id: organizationId
      },
      {
        name: 'José Roberto Santos',
        age: 82,
        gender: 'M' as const,
        admission_date: '2023-01-20',
        room: '205',
        emergency_contact_name: 'Ana Paula Santos',
        emergency_contact_phone: '(11) 99876-5432',
        emergency_contact_relation: 'Filha',
        health_status: 'attention' as const,
        notes: 'Paciente com início de demência. Necessita acompanhamento constante durante as refeições. Ex-professor de matemática, responde bem a atividades cognitivas. Histórico de quedas - usar proteção lateral na cama.',
        monthly_fee_amount: 3200.00,
        user_id: userId,
        organization_id: organizationId
      },
      {
        name: 'Antônio Carlos Oliveira',
        age: 85,
        gender: 'M' as const,
        admission_date: '2023-05-10',
        room: '150',
        emergency_contact_name: 'Carmen Oliveira',
        emergency_contact_phone: '(11) 97654-3210',
        emergency_contact_relation: 'Esposa',
        health_status: 'critical' as const,
        notes: 'Paciente com problemas cardíacos graves. Monitoramento 24h necessário. Uso de oxigênio noturno. Dieta restrita em sódio. Fisioterapia respiratória diária às 14h. Família muito presente e participativa no cuidado.',
        monthly_fee_amount: 4500.00,
        user_id: userId,
        organization_id: organizationId
      }
    ];

    console.log('Inserting test residents with organization_id:', organizationId);
    
    const { data, error } = await supabase
      .from('residents')
      .insert(testResidents)
      .select();

    if (error) {
      console.error('Supabase error creating test residents:', error);
      throw new Error(`Erro ao criar residentes: ${error.message}`);
    }

    console.log('Test residents created successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to create test residents:', error);
    throw error;
  }
};

export const createTestMedications = async (userId: string, residents: any[], organizationId?: string) => {
  try {
    // Fetch the current organization_id from user_profiles if not provided
    if (!organizationId) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .single();
      
      if (!userProfileError && userProfile && userProfile.organization_id) {
        organizationId = userProfile.organization_id;
        console.log('Using organization_id from user profile:', organizationId);
      } else {
        console.log('No organization_id found in user profile, using null');
      }
    }

    const testMedications = [
      {
        name: 'Losartana',
        dosage: '50mg',
        frequency: '1x ao dia',
        time_schedule: ['08:00'],
        resident_id: residents[0]?.id, // Maria das Graças
        prescribed_by: 'Dr. Carlos Mendes',
        start_date: '2023-03-16',
        status: 'active' as const,
        user_id: userId,
        organization_id: organizationId
      },
      {
        name: 'Metformina',
        dosage: '850mg',
        frequency: '2x ao dia',
        time_schedule: ['08:00', '20:00'],
        resident_id: residents[0]?.id, // Maria das Graças
        prescribed_by: 'Dr. Carlos Mendes',
        start_date: '2023-03-16',
        status: 'active' as const,
        user_id: userId,
        organization_id: organizationId
      },
      {
        name: 'Donepezila',
        dosage: '10mg',
        frequency: '1x ao dia',
        time_schedule: ['20:00'],
        resident_id: residents[1]?.id, // José Roberto
        prescribed_by: 'Dr. Ana Beatriz',
        start_date: '2023-01-25',
        status: 'active' as const,
        user_id: userId,
        organization_id: organizationId
      },
      {
        name: 'Digoxina',
        dosage: '0,25mg',
        frequency: '1x ao dia',
        time_schedule: ['08:00'],
        resident_id: residents[2]?.id, // Antônio Carlos
        prescribed_by: 'Dr. Roberto Lima',
        start_date: '2023-05-12',
        status: 'active' as const,
        user_id: userId,
        organization_id: organizationId
      },
      {
        name: 'Furosemida',
        dosage: '40mg',
        frequency: '1x ao dia',
        time_schedule: ['08:00'],
        resident_id: residents[2]?.id, // Antônio Carlos
        prescribed_by: 'Dr. Roberto Lima',
        start_date: '2023-05-12',
        status: 'active' as const,
        user_id: userId,
        organization_id: organizationId
      }
    ];

    console.log('Creating test medications for residents with organization_id:', organizationId);
    
    const { data, error } = await supabase
      .from('medications')
      .insert(testMedications.filter(med => med.resident_id)) // Only insert if resident_id exists
      .select();

    if (error) {
      console.error('Supabase error creating test medications:', error);
      throw new Error(`Erro ao criar medicações: ${error.message}`);
    }

    console.log('Test medications created successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to create test medications:', error);
    throw error;
  }
};

export const createCompleteTestData = async (userId: string, organizationId?: string) => {
  try {
    console.log('Starting complete test data creation for user:', userId);
    
    // Fetch the current organization_id from user_profiles if not provided
    if (!organizationId) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .single();
      
      if (!userProfileError && userProfile && userProfile.organization_id) {
        organizationId = userProfile.organization_id;
        console.log('Using organization_id from user profile:', organizationId);
      } else {
        console.log('No organization_id found in user profile, using null');
      }
    }
    
    // First create residents
    const residents = await createTestResidents(userId, organizationId);
    
    // Then create medications for those residents
    const medications = await createTestMedications(userId, residents, organizationId);
    
    console.log('Complete test data created successfully:', {
      residents: residents.length,
      medications: medications.length
    });
    
    return {
      residents,
      medications
    };
  } catch (error) {
    console.error('Failed to create complete test data:', error);
    throw error;
  }
};
