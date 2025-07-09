import { supabase } from '../lib/supabase';

export const createTestFamilyMembers = async (userId: string, residents: any[], organizationId?: string) => {
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

    const testFamilyMembers = [
      // Maria das Graças Silva
      {
        name: 'João Carlos Silva',
        phone: '(11) 98765-4321',
        email: 'joao.silva@email.com',
        relation: 'Filho',
        resident_id: residents[0]?.id,
        is_primary: true,
        notes: 'Contato principal. Disponível durante horário comercial.',
        user_id: userId,
        organization_id: organizationId
      },
      {
        name: 'Maria Silva',
        phone: '(11) 97654-3210',
        email: 'maria.silva@email.com',
        relation: 'Nora',
        resident_id: residents[0]?.id,
        is_primary: false,
        notes: 'Esposa do João Carlos. Muito atenciosa com a sogra.',
        user_id: userId,
        organization_id: organizationId
      },
      // José Roberto Santos
      {
        name: 'Ana Paula Santos',
        phone: '(11) 99876-5432',
        email: 'ana.santos@email.com',
        relation: 'Filha',
        resident_id: residents[1]?.id,
        is_primary: true,
        notes: 'Mora próximo à instituição. Visita regularmente.',
        user_id: userId,
        organization_id: organizationId
      },
      {
        name: 'Carlos Santos Jr.',
        phone: '(11) 98765-1234',
        email: 'carlos.jr@email.com',
        relation: 'Filho',
        resident_id: residents[1]?.id,
        is_primary: false,
        notes: 'Mora em outra cidade. Contato por telefone.',
        user_id: userId,
        organization_id: organizationId
      },
      // Antônio Carlos Oliveira
      {
        name: 'Carmen Oliveira',
        phone: '(11) 97654-3210',
        email: 'carmen.oliveira@email.com',
        relation: 'Esposa',
        resident_id: residents[2]?.id,
        is_primary: true,
        notes: 'Muito presente. Acompanha todos os tratamentos médicos.',
        user_id: userId,
        organization_id: organizationId
      },
      {
        name: 'Roberto Oliveira',
        phone: '(11) 96543-2109',
        email: 'roberto.oliveira@email.com',
        relation: 'Filho',
        resident_id: residents[2]?.id,
        is_primary: false,
        notes: 'Médico. Ajuda com questões de saúde do pai.',
        user_id: userId,
        organization_id: organizationId
      }
    ];

    console.log('Creating test family members for residents with organization_id:', organizationId);
    
    const { data, error } = await supabase
      .from('family_members')
      .insert(testFamilyMembers.filter(member => member.resident_id))
      .select();

    if (error) {
      console.error('Supabase error creating test family members:', error);
      throw new Error(`Erro ao criar familiares: ${error.message}`);
    }

    console.log('Test family members created successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to create test family members:', error);
    throw error;
  }
};

export const createTestFamilyMessages = async (userId: string, residents: any[], familyMembers: any[], organizationId?: string) => {
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

    const testMessages = [
      {
        resident_id: residents[0]?.id,
        family_member_id: familyMembers.find(f => f.name === 'João Carlos Silva')?.id,
        from_name: 'João Carlos Silva',
        message: 'Boa tarde! Como a mamãe passou o fim de semana? Ela mencionou que gostou muito da atividade de pintura na sexta-feira. Gostaria de saber se ela tem participado regularmente das atividades recreativas. Também queria perguntar sobre a medicação para pressão - ela está tomando no horário correto?',
        type: 'update' as const,
        read: false,
        user_id: userId,
        organization_id: organizationId
      },
      {
        resident_id: residents[1]?.id,
        family_member_id: familyMembers.find(f => f.name === 'Ana Paula Santos')?.id,
        from_name: 'Ana Paula Santos',
        message: 'Gostaria de agendar uma visita para amanhã às 15h. Meu pai tem perguntado muito por mim e quero levar os netos para visitá-lo. É possível? Também gostaria de conversar com a equipe médica sobre o progresso dele.',
        type: 'request' as const,
        read: false,
        user_id: userId,
        organization_id: organizationId
      },
      {
        resident_id: residents[2]?.id,
        family_member_id: familyMembers.find(f => f.name === 'Carmen Oliveira')?.id,
        from_name: 'Carmen Oliveira',
        message: 'Obrigada pelo cuidado especial com o Antônio. Notei que ele está mais animado nas nossas conversas por telefone. A fisioterapia respiratória está ajudando muito. Vocês são anjos!',
        type: 'update' as const,
        read: true,
        user_id: userId,
        organization_id: organizationId
      },
      {
        resident_id: residents[0]?.id,
        family_member_id: familyMembers.find(f => f.name === 'Maria Silva')?.id,
        from_name: 'Maria Silva',
        message: 'Sou nora da Dona Maria das Graças. Gostaria de saber se ela precisa de alguma roupa nova ou produtos de higiene pessoal. Também quero agradecer pela paciência com ela - sei que às vezes ela fica um pouco teimosa.',
        type: 'update' as const,
        read: true,
        user_id: userId,
        organization_id: organizationId
      },
      {
        resident_id: residents[1]?.id,
        family_member_id: familyMembers.find(f => f.name === 'Carlos Santos Jr.')?.id,
        from_name: 'Carlos Santos Jr.',
        message: 'Estou preocupado porque ele mencionou que não está dormindo bem. Vocês poderiam verificar se está tudo bem? Talvez seja necessário ajustar alguma medicação.',
        type: 'request' as const,
        read: false,
        user_id: userId,
        organization_id: organizationId
      },
      {
        resident_id: residents[2]?.id,
        family_member_id: familyMembers.find(f => f.name === 'Carmen Oliveira')?.id,
        from_name: 'Carmen Oliveira',
        message: 'URGENTE: Meu marido Antônio está com dificuldade para respirar durante a noite. Por favor, verifiquem o oxigênio e chamem o médico se necessário. Estou muito preocupada.',
        type: 'emergency' as const,
        read: true,
        user_id: userId,
        organization_id: organizationId
      },
      // Responses from staff
      {
        resident_id: residents[1]?.id,
        from_name: 'Equipe de Enfermagem',
        message: 'Olá Ana Paula! Claro, pode vir amanhã às 15h. Seu pai ficará muito feliz em ver os netos. Vou avisar a equipe médica para estar disponível para conversar com você sobre o progresso dele.',
        type: 'response' as const,
        read: false,
        parent_message_id: null, // Will be set to the request message ID
        user_id: userId,
        organization_id: organizationId
      },
      {
        resident_id: residents[2]?.id,
        from_name: 'Dr. Roberto Lima',
        message: 'Carmen, obrigado por nos avisar. Já verificamos o Sr. Antônio e ajustamos o fluxo de oxigênio. Ele está estável agora. Vamos monitorá-lo mais de perto durante a noite. Pode ficar tranquila.',
        type: 'response' as const,
        read: true,
        parent_message_id: null, // Will be set to the emergency message ID
        user_id: userId,
        organization_id: organizationId
      },
      {
        resident_id: residents[0]?.id,
        from_name: 'Coordenação',
        message: 'João Carlos, sua mãe está participando bem das atividades. Ela realmente gosta de pintura e artesanato. Sobre a medicação, está sendo administrada corretamente nos horários 8h e 20h. Ela tem colaborado muito bem.',
        type: 'response' as const,
        read: false,
        parent_message_id: null, // Will be set to the update message ID
        user_id: userId,
        organization_id: organizationId
      }
    ];

    console.log('Creating test family messages for residents with organization_id:', organizationId);
    
    const { data, error } = await supabase
      .from('family_messages')
      .insert(testMessages.filter(msg => msg.resident_id))
      .select();

    if (error) {
      console.error('Supabase error creating test family messages:', error);
      throw new Error(`Erro ao criar mensagens familiares: ${error.message}`);
    }

    console.log('Test family messages created successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to create test family messages:', error);
    throw error;
  }
};

export const createTestFamilyData = async (userId: string, residents: any[], organizationId?: string) => {
  try {
    console.log('Starting test family data creation for user:', userId);
    
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
    
    if (residents.length === 0) {
      throw new Error('Nenhum residente encontrado. Crie residentes primeiro.');
    }
    
    // Create family members first
    const familyMembers = await createTestFamilyMembers(userId, residents, organizationId);
    
    // Then create family messages
    const familyMessages = await createTestFamilyMessages(userId, residents, familyMembers, organizationId);
    
    console.log('Complete test family data created successfully:', {
      familyMembers: familyMembers.length,
      familyMessages: familyMessages.length
    });
    
    return {
      familyMembers,
      familyMessages
    };
  } catch (error) {
    console.error('Failed to create complete test family data:', error);
    throw error;
  }
};
