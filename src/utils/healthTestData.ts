import { supabase } from '../lib/supabase';

export const createTestHealthData = async (userId: string, residents: any[], organizationId?: string) => {
  try {
    console.log('Creating test health data for user:', userId);
    
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

    // Create vital signs for 90 days
    const vitalSigns = await createTestVitalSigns(userId, residents, organizationId);
    
    // Create elimination records for 90 days
    const eliminationRecords = await createTestEliminationRecords(userId, residents, organizationId);
    
    // Create intercurrences for 90 days
    const intercurrences = await createTestIntercurrences(userId, residents, organizationId);
    
    console.log('Complete test health data created successfully:', {
      vitalSigns: vitalSigns.length,
      eliminationRecords: eliminationRecords.length,
      intercurrences: intercurrences.length
    });
    
    return {
      vitalSigns,
      eliminationRecords,
      intercurrences
    };
  } catch (error) {
    console.error('Failed to create complete test health data:', error);
    throw error;
  }
};

const createTestVitalSigns = async (userId: string, residents: any[], organizationId?: string) => {
  // Fetch the current organization_id from user_profiles if not provided
  if (!organizationId) {
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (!userProfileError && userProfile && userProfile.organization_id) {
      organizationId = userProfile.organization_id;
      console.log('Using organization_id from user profile for vital signs:', organizationId);
    } else {
      console.log('No organization_id found in user profile for vital signs, using null');
    }
  }

  const vitalSigns = [];
  const currentDate = new Date();
  
  // Create vital signs for last 90 days
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const recordDate = new Date(currentDate);
    recordDate.setDate(currentDate.getDate() - dayOffset);
    
    // Skip some days randomly (not every day has records)
    if (Math.random() < 0.15) continue; // 15% chance to skip a day
    
    // Create 1-3 records per day for each resident
    residents.forEach(resident => {
      const recordsPerDay = Math.floor(Math.random() * 3) + 1; // 1-3 records
      
      for (let i = 0; i < recordsPerDay; i++) {
        // Distribute records throughout the day
        const hour = 6 + (i * 8) + Math.floor(Math.random() * 4); // 6h, 14h, 22h with variation
        const minute = Math.floor(Math.random() * 60);
        
        recordDate.setHours(hour, minute, 0, 0);
        
        // Generate realistic vital signs based on resident's health status and time trends
        const isHealthy = resident.health_status === 'stable';
        const isAttention = resident.health_status === 'attention';
        const isCritical = resident.health_status === 'critical';
        
        // Add some deterioration over time for critical patients
        const timeDecayFactor = isCritical ? (dayOffset / 90) * 0.3 : 0;
        
        // Generate base values with realistic variations
        let systolic = isHealthy ? 120 + Math.floor(Math.random() * 20) : 
                      isAttention ? 140 + Math.floor(Math.random() * 30) :
                      160 + Math.floor(Math.random() * 40);
        
        let diastolic = isHealthy ? 80 + Math.floor(Math.random() * 10) : 
                       isAttention ? 90 + Math.floor(Math.random() * 15) :
                       100 + Math.floor(Math.random() * 20);
        
        let oxygenSat = isHealthy ? 96 + Math.random() * 4 : 
                       isAttention ? 92 + Math.random() * 6 :
                       88 + Math.random() * 8;
        
        let glucose = isHealthy ? 80 + Math.floor(Math.random() * 40) : 
                     isAttention ? 100 + Math.floor(Math.random() * 80) :
                     150 + Math.floor(Math.random() * 100);
        
        let heartRate = isHealthy ? 60 + Math.floor(Math.random() * 20) : 
                       isAttention ? 70 + Math.floor(Math.random() * 25) :
                       90 + Math.floor(Math.random() * 30);
        
        let temperature = isHealthy ? 36.0 + Math.random() * 1.0 : 
                         isAttention ? 36.5 + Math.random() * 1.2 :
                         37.0 + Math.random() * 1.5;
        
        // Apply time decay for critical patients
        if (isCritical) {
          systolic += timeDecayFactor * 20;
          diastolic += timeDecayFactor * 10;
          oxygenSat -= timeDecayFactor * 8;
          heartRate += timeDecayFactor * 15;
          temperature += timeDecayFactor * 1.0;
        }
        
        // Add some random spikes/drops to simulate real conditions
        if (Math.random() < 0.1) { // 10% chance of abnormal readings
          if (Math.random() < 0.5) {
            // Hypertensive crisis
            systolic += 40 + Math.floor(Math.random() * 30);
            diastolic += 20 + Math.floor(Math.random() * 15);
          } else {
            // Hypotensive episode
            systolic -= 30 + Math.floor(Math.random() * 20);
            diastolic -= 15 + Math.floor(Math.random() * 10);
          }
        }
        
        if (Math.random() < 0.08) { // 8% chance of oxygen desaturation
          oxygenSat -= 10 + Math.random() * 15;
        }
        
        if (Math.random() < 0.12) { // 12% chance of glucose spike
          glucose += 50 + Math.floor(Math.random() * 100);
        }
        
        if (Math.random() < 0.07) { // 7% chance of fever
          temperature += 1.5 + Math.random() * 2.0;
        }
        
        // Ensure values are within realistic bounds
        systolic = Math.max(70, Math.min(250, systolic));
        diastolic = Math.max(40, Math.min(150, diastolic));
        oxygenSat = Math.max(70, Math.min(100, oxygenSat));
        glucose = Math.max(40, Math.min(500, glucose));
        heartRate = Math.max(40, Math.min(180, heartRate));
        temperature = Math.max(34.0, Math.min(42.0, temperature));
        
        // Skip some measurements randomly (not all vital signs measured every time)
        const measurements: any = {
          resident_id: resident.id,
          recorded_at: recordDate.toISOString(),
          user_id: userId,
          organization_id: organizationId
        };
        
        if (Math.random() > 0.1) measurements.systolic_pressure = Math.round(systolic);
        if (Math.random() > 0.1) measurements.diastolic_pressure = Math.round(diastolic);
        if (Math.random() > 0.2) measurements.oxygen_saturation = Math.round(oxygenSat * 100) / 100;
        if (Math.random() > 0.3) measurements.glucose = Math.round(glucose);
        if (Math.random() > 0.15) measurements.heart_rate = Math.round(heartRate);
        if (Math.random() > 0.2) measurements.temperature = Math.round(temperature * 100) / 100;
        
        // Add observations for abnormal values
        const observations = [];
        if (measurements.systolic_pressure > 180 || measurements.systolic_pressure < 90) {
          observations.push('Pressão arterial alterada');
        }
        if (measurements.oxygen_saturation < 90) {
          observations.push('Saturação baixa');
        }
        if (measurements.glucose > 200) {
          observations.push('Glicemia elevada');
        }
        if (measurements.temperature > 37.5) {
          observations.push('Febre');
        }
        if (measurements.heart_rate > 100 || measurements.heart_rate < 60) {
          observations.push('Frequência cardíaca alterada');
        }
        
        if (observations.length > 0) {
          measurements.observations = observations.join(', ') + '. ' + getRandomObservation(resident.health_status);
        } else if (Math.random() > 0.7) {
          measurements.observations = getRandomObservation(resident.health_status);
        }
        
        vitalSigns.push(measurements);
      }
    });
  }

  console.log('Creating test vital signs with organization_id:', organizationId);

  // Insert in batches to avoid timeout
  const batchSize = 100;
  const allData = [];
  
  for (let i = 0; i < vitalSigns.length; i += batchSize) {
    const batch = vitalSigns.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('vital_signs')
      .insert(batch)
      .select();

    if (error) {
      console.error('Supabase error creating vital signs batch:', error);
      throw new Error(`Erro ao criar sinais vitais: ${error.message}`);
    }
    
    allData.push(...data);
  }

  return allData;
};

const createTestEliminationRecords = async (userId: string, residents: any[], organizationId?: string) => {
  // Fetch the current organization_id from user_profiles if not provided
  if (!organizationId) {
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (!userProfileError && userProfile && userProfile.organization_id) {
      organizationId = userProfile.organization_id;
      console.log('Using organization_id from user profile for elimination records:', organizationId);
    } else {
      console.log('No organization_id found in user profile for elimination records, using null');
    }
  }

  const eliminationRecords = [];
  const currentDate = new Date();
  
  // Create elimination records for last 90 days
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const recordDate = new Date(currentDate);
    recordDate.setDate(currentDate.getDate() - dayOffset);
    
    // Skip some days randomly
    if (Math.random() < 0.05) continue; // 5% chance to skip a day
    
    residents.forEach(resident => {
      // 3-8 elimination records per resident per day (more realistic)
      const recordsPerDay = Math.floor(Math.random() * 6) + 3; // 3-8 records
      
      for (let i = 0; i < recordsPerDay; i++) {
        const hour = 6 + Math.floor(Math.random() * 18); // 6h to 24h
        const minute = Math.floor(Math.random() * 60);
        
        recordDate.setHours(hour, minute, 0, 0);
        
        // 70% urine, 30% evacuation (more realistic ratio)
        const type = Math.random() > 0.3 ? 'urine' : 'evacuation';
        
        const record: any = {
          resident_id: resident.id,
          type,
          recorded_at: recordDate.toISOString(),
          user_id: userId,
          organization_id: organizationId
        };
        
        if (type === 'evacuation') {
          // Evacuation patterns
          record.evacuation_count = Math.floor(Math.random() * 3) + 1; // 1-3
          
          // Realistic consistency distribution
          const consistencyRandom = Math.random();
          if (consistencyRandom < 0.4) {
            record.evacuation_consistency = 'solid';
          } else if (consistencyRandom < 0.7) {
            record.evacuation_consistency = 'soft';
          } else if (consistencyRandom < 0.85) {
            record.evacuation_consistency = 'hard';
          } else if (consistencyRandom < 0.95) {
            record.evacuation_consistency = 'liquid';
          } else {
            record.evacuation_consistency = 'other';
          }
          
          // Add problems for some residents based on health status
          if (resident.health_status === 'critical' && Math.random() < 0.3) {
            record.evacuation_consistency = 'liquid'; // Diarrhea more common
          }
          
          if (resident.health_status === 'attention' && Math.random() < 0.2) {
            record.evacuation_consistency = 'hard'; // Constipation
          }
          
        } else {
          // Urine patterns
          record.urine_volume = 50 + Math.floor(Math.random() * 350); // 50-400ml
          
          // Realistic color distribution
          const colorRandom = Math.random();
          if (colorRandom < 0.3) {
            record.urine_color = 'clear';
          } else if (colorRandom < 0.7) {
            record.urine_color = 'yellow';
          } else if (colorRandom < 0.9) {
            record.urine_color = 'dark_yellow';
          } else if (colorRandom < 0.97) {
            record.urine_color = 'amber';
          } else {
            record.urine_color = 'brown'; // Concerning color
          }
          
          // Adjust volume based on health status
          if (resident.health_status === 'critical') {
            record.urine_volume = Math.max(30, record.urine_volume * 0.7); // Reduced output
          }
          
          // Dehydration signs for critical patients
          if (resident.health_status === 'critical' && Math.random() < 0.4) {
            record.urine_color = 'dark_yellow';
            record.urine_volume = Math.max(30, record.urine_volume * 0.6);
          }
        }
        
        // Add observations for concerning patterns
        if (Math.random() > 0.8) {
          record.observations = getRandomEliminationObservation(type, record);
        }
        
        // Add specific observations for problems
        if (type === 'evacuation' && record.evacuation_consistency === 'liquid') {
          record.observations = 'Diarreia - monitorar hidratação';
        } else if (type === 'evacuation' && record.evacuation_consistency === 'hard') {
          record.observations = 'Constipação - avaliar dieta e hidratação';
        } else if (type === 'urine' && record.urine_volume < 100) {
          record.observations = 'Volume reduzido - atenção à hidratação';
        } else if (type === 'urine' && record.urine_color === 'brown') {
          record.observations = 'Cor alterada - comunicar equipe médica';
        }
        
        eliminationRecords.push(record);
      }
    });
  }

  console.log('Creating test elimination records with organization_id:', organizationId);

  // Insert in batches
  const batchSize = 100;
  const allData = [];
  
  for (let i = 0; i < eliminationRecords.length; i += batchSize) {
    const batch = eliminationRecords.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('elimination_records')
      .insert(batch)
      .select();

    if (error) {
      console.error('Supabase error creating elimination records batch:', error);
      throw new Error(`Erro ao criar registros de eliminação: ${error.message}`);
    }
    
    allData.push(...data);
  }

  return allData;
};

const createTestIntercurrences = async (userId: string, residents: any[], organizationId?: string) => {
  // Fetch the current organization_id from user_profiles if not provided
  if (!organizationId) {
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (!userProfileError && userProfile && userProfile.organization_id) {
      organizationId = userProfile.organization_id;
      console.log('Using organization_id from user profile for intercurrences:', organizationId);
    } else {
      console.log('No organization_id found in user profile for intercurrences, using null');
    }
  }

  const intercurrences = [];
  const currentDate = new Date();
  
  const intercurrenceTypes = [
    { 
      type: 'fall', 
      severities: ['mild', 'moderate', 'severe'],
      descriptions: [
        'Queda no banheiro durante a madrugada',
        'Tropeçou no corredor após o almoço',
        'Queda da cama durante o sono',
        'Escorregou no chuveiro',
        'Perda de equilíbrio ao levantar da cadeira'
      ],
      actions: [
        'Avaliação médica, aplicação de gelo, observação por 24h',
        'Exame neurológico, raio-X preventivo',
        'Contenção lateral na cama, fisioterapia'
      ]
    },
    { 
      type: 'vomiting', 
      severities: ['mild', 'moderate'],
      descriptions: [
        'Episódio de vômito após o almoço',
        'Náuseas e vômitos matinais',
        'Vômito com restos alimentares',
        'Episódio de vômito durante a medicação'
      ],
      actions: [
        'Hidratação, dieta leve, monitoramento',
        'Suspensão temporária da alimentação',
        'Avaliação médica, medicação antiemética'
      ]
    },
    { 
      type: 'pain', 
      severities: ['mild', 'moderate', 'severe'],
      descriptions: [
        'Dor abdominal intensa',
        'Cefaleia persistente',
        'Dor torácica ao respirar',
        'Dor lombar após mobilização',
        'Dor articular generalizada'
      ],
      actions: [
        'Administração de analgésico, contato com médico',
        'Posicionamento adequado, compressa morna',
        'Avaliação médica urgente, ECG'
      ]
    },
    { 
      type: 'breathing_difficulty', 
      severities: ['moderate', 'severe', 'critical'],
      descriptions: [
        'Dificuldade respiratória durante a noite',
        'Dispneia aos pequenos esforços',
        'Chiado no peito e tosse seca',
        'Respiração superficial e rápida'
      ],
      actions: [
        'Oxigenoterapia, posicionamento, chamada médica urgente',
        'Nebulização, monitoramento contínuo',
        'Transferência para hospital'
      ]
    },
    { 
      type: 'behavioral_change', 
      severities: ['mild', 'moderate'],
      descriptions: [
        'Agitação e confusão mental',
        'Episódio de agressividade verbal',
        'Desorientação temporal e espacial',
        'Recusa alimentar e medicamentosa',
        'Choro excessivo sem causa aparente'
      ],
      actions: [
        'Conversa tranquilizadora, ambiente calmo',
        'Contato com família, avaliação psicológica',
        'Medicação conforme prescrição médica'
      ]
    },
    { 
      type: 'skin_injury', 
      severities: ['mild', 'moderate'],
      descriptions: [
        'Pequeno corte no braço',
        'Escoriação no joelho',
        'Hematoma após queda',
        'Lesão por pressão em formação',
        'Arranhão por unha'
      ],
      actions: [
        'Limpeza, curativo, aplicação de antisséptico',
        'Curativo especializado, acompanhamento diário',
        'Mudança de decúbito, colchão especial'
      ]
    },
    { 
      type: 'fainting', 
      severities: ['moderate', 'severe'],
      descriptions: [
        'Desmaio ao levantar da cama',
        'Perda de consciência momentânea',
        'Tontura seguida de queda',
        'Síncope durante banho'
      ],
      actions: [
        'Verificação de sinais vitais, posição de segurança',
        'Avaliação médica, exames complementares',
        'Monitoramento cardíaco'
      ]
    },
    { 
      type: 'seizure', 
      severities: ['severe', 'critical'],
      descriptions: [
        'Crise convulsiva generalizada',
        'Episódio de tremores',
        'Convulsão tônico-clônica',
        'Crise epiléptica'
      ],
      actions: [
        'Proteção durante crise, posição lateral',
        'Medicação anticonvulsivante, chamada médica',
        'Transferência para emergência'
      ]
    }
  ];
  
  // Create intercurrences over the last 90 days
  // More frequent for critical patients, less for stable
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const recordDate = new Date(currentDate);
    recordDate.setDate(currentDate.getDate() - dayOffset);
    
    residents.forEach(resident => {
      let intercurrenceChance = 0.02; // 2% base chance per day
      
      // Adjust based on health status
      if (resident.health_status === 'critical') {
        intercurrenceChance = 0.15; // 15% chance for critical patients
      } else if (resident.health_status === 'attention') {
        intercurrenceChance = 0.08; // 8% chance for attention patients
      }
      
      // Higher chance in recent days (deterioration over time)
      if (dayOffset < 30) {
        intercurrenceChance *= 1.5;
      }
      
      if (Math.random() < intercurrenceChance) {
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        
        recordDate.setHours(hour, minute, 0, 0);
        
        // Select intercurrence type based on health status
        let availableTypes = intercurrenceTypes;
        
        if (resident.health_status === 'stable') {
          // Stable patients have fewer severe intercurrences
          availableTypes = intercurrenceTypes.filter(t => 
            !['seizure', 'breathing_difficulty'].includes(t.type)
          );
        }
        
        const intercurrenceTemplate = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const description = intercurrenceTemplate.descriptions[Math.floor(Math.random() * intercurrenceTemplate.descriptions.length)];
        const action = intercurrenceTemplate.actions[Math.floor(Math.random() * intercurrenceTemplate.actions.length)];
        
        // Select severity based on health status
        let availableSeverities = intercurrenceTemplate.severities;
        if (resident.health_status === 'stable') {
          availableSeverities = availableSeverities.filter(s => s !== 'critical');
        } else if (resident.health_status === 'critical') {
          // Critical patients more likely to have severe intercurrences
          availableSeverities = availableSeverities.map(s => 
            s === 'mild' ? 'moderate' : s === 'moderate' ? 'severe' : s
          );
        }
        
        const severity = availableSeverities[Math.floor(Math.random() * availableSeverities.length)];
        
        intercurrences.push({
          resident_id: resident.id,
          type: intercurrenceTemplate.type,
          description: description,
          severity: severity,
          actions_taken: action,
          outcome: getRandomOutcome(severity, intercurrenceTemplate.type),
          occurred_at: recordDate.toISOString(),
          user_id: userId,
          organization_id: organizationId
        });
      }
    });
  }

  console.log('Creating test intercurrences with organization_id:', organizationId);

  const { data, error } = await supabase
    .from('intercurrences')
    .insert(intercurrences)
    .select();

  if (error) {
    console.error('Supabase error creating intercurrences:', error);
    throw new Error(`Erro ao criar intercorrências: ${error.message}`);
  }

  return data;
};

const getRandomObservation = (healthStatus: string) => {
  const observations = {
    stable: [
      'Paciente calmo e colaborativo',
      'Sinais vitais dentro da normalidade',
      'Boa aceitação da medicação',
      'Sem queixas no momento',
      'Participou das atividades recreativas',
      'Alimentação adequada',
      'Sono tranquilo'
    ],
    attention: [
      'Paciente um pouco agitado',
      'Pressão ligeiramente elevada',
      'Necessita monitoramento mais frequente',
      'Queixa de leve desconforto',
      'Oscilação do humor',
      'Redução do apetite',
      'Sono fragmentado'
    ],
    critical: [
      'Paciente necessita atenção constante',
      'Sinais vitais alterados',
      'Monitoramento contínuo necessário',
      'Família comunicada sobre o estado',
      'Redução significativa da mobilidade',
      'Dificuldade de comunicação',
      'Estado geral comprometido'
    ]
  };
  
  const statusObservations = observations[healthStatus as keyof typeof observations] || observations.stable;
  return statusObservations[Math.floor(Math.random() * statusObservations.length)];
};

const getRandomEliminationObservation = (type: string, record: any) => {
  const observations = {
    evacuation: [
      'Evacuação normal',
      'Sem dificuldades',
      'Paciente relatou alívio',
      'Consistência adequada',
      'Uso de laxante conforme prescrição',
      'Estimulação com supositório',
      'Necessitou auxílio para higiene'
    ],
    urine: [
      'Micção espontânea',
      'Sem ardor ou dificuldade',
      'Volume adequado',
      'Cor normal',
      'Uso de fralda',
      'Necessitou cateterismo',
      'Incontinência urinária'
    ]
  };
  
  const typeObservations = observations[type as keyof typeof observations];
  return typeObservations[Math.floor(Math.random() * typeObservations.length)];
};

const getRandomOutcome = (severity: string, type: string) => {
  const outcomes = {
    mild: [
      'Resolvido sem complicações',
      'Paciente se recuperou bem',
      'Situação controlada',
      'Sem necessidade de intervenção adicional',
      'Retorno às atividades normais',
      'Melhora espontânea observada'
    ],
    moderate: [
      'Situação estabilizada',
      'Requer acompanhamento',
      'Melhora gradual observada',
      'Protocolo seguido com sucesso',
      'Necessário ajuste na medicação',
      'Fisioterapia iniciada'
    ],
    severe: [
      'Paciente estabilizado após intervenção',
      'Necessário acompanhamento médico contínuo',
      'Família informada sobre a situação',
      'Protocolos de emergência ativados',
      'Transferência para observação',
      'Medicação de emergência administrada'
    ],
    critical: [
      'Situação crítica controlada',
      'Transferência para hospital considerada',
      'Monitoramento 24h implementado',
      'Equipe médica acionada',
      'UTI móvel solicitada',
      'Família chamada urgentemente'
    ]
  };
  
  const severityOutcomes = outcomes[severity as keyof typeof outcomes] || outcomes.mild;
  return severityOutcomes[Math.floor(Math.random() * severityOutcomes.length)];
};
