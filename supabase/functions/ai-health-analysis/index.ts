const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { userId, residentId } = await req.json();

    if (!userId) {
      throw new Error("Missing userId parameter");
    }

    // Fetch health data
    const healthData = await fetchHealthData(supabase, userId, residentId);
    
    if (healthData.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient data for analysis",
          details: "No health data found for the specified criteria. Please ensure residents have recorded health data in the past 30 days."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    let aiResponse;

    // Try to analyze with OpenAI if API key is available
    if (openaiApiKey && openaiApiKey.trim() !== "") {
      try {
        console.log("Attempting OpenAI analysis...");
        aiResponse = await analyzeWithOpenAI(healthData, openaiApiKey);
        console.log("OpenAI analysis successful");
      } catch (error) {
        console.warn("OpenAI API failed, using fallback analysis:", error.message);
        // Fallback to rule-based analysis
        aiResponse = generateFallbackAnalysis(healthData);
        // Add a note that this is fallback analysis
        aiResponse.summary = `[Análise Local] ${aiResponse.summary} (OpenAI indisponível: ${error.message})`;
      }
    } else {
      console.log("OpenAI API key not configured, using fallback analysis");
      // Fallback to rule-based analysis
      aiResponse = generateFallbackAnalysis(healthData);
      // Add a note that this is fallback analysis
      aiResponse.summary = `[Análise Local] ${aiResponse.summary} (Chave da API OpenAI não configurada)`;
    }
    
    // Save insights to database
    try {
      await saveInsights(supabase, userId, aiResponse, healthData);
    } catch (saveError) {
      console.warn("Failed to save insights to database:", saveError.message);
      // Don't fail the entire request if saving insights fails
    }

    return new Response(
      JSON.stringify(aiResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in AI health analysis:", error);
    
    // Ensure we always return a proper error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: "An error occurred during health data analysis. Please try again or contact support if the issue persists."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function fetchHealthData(supabase: any, userId: string, residentId?: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

  // Fetch residents
  let residentsQuery = supabase
    .from('residents')
    .select('*')
    .eq('user_id', userId);

  if (residentId) {
    residentsQuery = residentsQuery.eq('id', residentId);
  }

  const { data: residents, error: residentsError } = await residentsQuery;
  
  if (residentsError) throw residentsError;
  if (!residents || residents.length === 0) return [];

  const healthPatterns = [];

  for (const resident of residents) {
    // Fetch vital signs
    const { data: vitalSigns } = await supabase
      .from('vital_signs')
      .select('*')
      .eq('resident_id', resident.id)
      .gte('recorded_at', thirtyDaysAgoStr)
      .order('recorded_at', { ascending: true });

    // Fetch intercurrences
    const { data: intercurrences } = await supabase
      .from('intercurrences')
      .select('*')
      .eq('resident_id', resident.id)
      .gte('occurred_at', thirtyDaysAgoStr)
      .order('occurred_at', { ascending: true });

    // Fetch elimination records
    const { data: eliminationRecords } = await supabase
      .from('elimination_records')
      .select('*')
      .eq('resident_id', resident.id)
      .gte('recorded_at', thirtyDaysAgoStr)
      .order('recorded_at', { ascending: true });

    healthPatterns.push({
      residentId: resident.id,
      residentName: resident.name,
      age: resident.age,
      gender: resident.gender,
      healthStatus: resident.health_status,
      vitalSigns: vitalSigns || [],
      intercurrences: intercurrences || [],
      eliminationRecords: eliminationRecords || [],
      timeframe: '30_days'
    });
  }

  return healthPatterns;
}

async function analyzeWithOpenAI(healthData: any[], apiKey: string) {
  const dataForAI = healthData.map(pattern => ({
    residentName: pattern.residentName,
    residentId: pattern.residentId,
    age: pattern.age,
    gender: pattern.gender,
    healthStatus: pattern.healthStatus,
    vitalSignsCount: pattern.vitalSigns.length,
    vitalSignsSummary: summarizeVitalSigns(pattern.vitalSigns),
    intercurrencesCount: pattern.intercurrences.length,
    intercurrencesSummary: summarizeIntercurrences(pattern.intercurrences),
    eliminationCount: pattern.eliminationRecords.length,
    eliminationSummary: summarizeElimination(pattern.eliminationRecords),
    recentCriticalEvents: identifyCriticalEvents(pattern)
  }));

  const systemPrompt = `
You are an expert geriatric healthcare AI assistant specializing in elderly care within long-term care facilities. Your task is to analyze health patterns and identify:
1. Early signs of clinical deterioration
2. Patterns indicating need for medical intervention
3. Trends suggesting improvement or stabilization
4. Correlations between different health indicators
5. Evidence-based preventive recommendations

Important context:
- Elderly population (65+ years) with multiple comorbidities
- 24-hour care environment with multidisciplinary team
- Focus on quality of life and complication prevention
- Need for clear communication with family and staff

Analysis guidelines:
- Consider age-adjusted reference values
- Prioritize safety and fall prevention
- Identify patterns of dehydration, infection, and cognitive deterioration
- Suggest non-pharmacological interventions when appropriate
- Consider psychosocial impact of recommendations

Always provide responses in valid JSON format, be specific in recommendations, and indicate appropriate urgency level.
`;

  const userPrompt = `
Analyze the following health data for elderly residents in a long-term care facility over the last 30 days:

${JSON.stringify(dataForAI, null, 2)}

Please provide a detailed analysis in JSON format with the following information:

{
  "insights": [
    {
      "type": "prediction|recommendation|alert|trend",
      "severity": "low|medium|high|critical",
      "title": "Concise insight title",
      "description": "Detailed description of the identified pattern",
      "recommendations": ["List of specific recommendations"],
      "confidence": 0.85,
      "dataPoints": 25,
      "timeframe": "30_days",
      "metadata": {
        "residentId": "resident_id",
        "residentName": "Resident name",
        "affectedSystems": ["cardiovascular", "respiratory"],
        "trendDirection": "increasing|decreasing|stable",
        "urgency": "immediate|within_24h|within_week|routine"
      }
    }
  ],
  "summary": "General summary of the analysis for all residents",
  "riskScore": 0.65,
  "nextReviewDate": "2024-01-15"
}

Focus on:
1. Identifying concerning patterns in vital signs
2. Detecting deterioration or improvement trends
3. Correlating intercurrences with other indicators
4. Suggesting preventive interventions
5. Prioritizing cases requiring urgent medical attention
6. Consider geriatric context and typical comorbidities

Be specific, practical, and evidence-based.
`;

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  let response;
  
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    
    // Handle different types of fetch errors
    if (fetchError.name === 'AbortError') {
      throw new Error("OpenAI API request timed out after 15 seconds");
    } else if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
      throw new Error("Network error: Unable to connect to OpenAI API");
    } else {
      const errorMessage = fetchError instanceof Error ? fetchError.message : "Network request failed";
      throw new Error(`Failed to connect to OpenAI API: ${errorMessage}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorText;
    try {
      errorText = await response.text();
    } catch (textError) {
      errorText = `HTTP ${response.status}`;
    }
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    throw new Error("Failed to parse OpenAI API response");
  }

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from OpenAI API");
  }

  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (parseError) {
    throw new Error("Failed to parse AI analysis result");
  }
}

function generateFallbackAnalysis(healthData: any[]) {
  const insights = [];
  let overallRiskScore = 0;
  
  for (const pattern of healthData) {
    const residentInsights = analyzeResidentPattern(pattern);
    insights.push(...residentInsights);
    
    // Calculate risk score based on patterns
    const riskFactors = calculateRiskFactors(pattern);
    overallRiskScore = Math.max(overallRiskScore, riskFactors.score);
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + 7);

  return {
    insights,
    summary: `Análise baseada em regras concluída para ${healthData.length} residente(s). ${insights.length} insights gerados com base em padrões clínicos e limites estabelecidos.`,
    riskScore: overallRiskScore,
    nextReviewDate: nextReviewDate.toISOString().split('T')[0]
  };
}

function analyzeResidentPattern(pattern: any) {
  const insights = [];
  const { residentId, residentName, vitalSigns, intercurrences, eliminationRecords } = pattern;

  // Analyze vital signs trends
  if (vitalSigns.length > 0) {
    const vitalInsights = analyzeVitalSigns(vitalSigns, residentId, residentName);
    insights.push(...vitalInsights);
  }

  // Analyze intercurrences
  if (intercurrences.length > 0) {
    const intercurrenceInsights = analyzeIntercurrences(intercurrences, residentId, residentName);
    insights.push(...intercurrenceInsights);
  }

  // Analyze elimination patterns
  if (eliminationRecords.length > 0) {
    const eliminationInsights = analyzeEliminationPatterns(eliminationRecords, residentId, residentName);
    insights.push(...eliminationInsights);
  }

  // Check for data gaps
  const dataGapInsights = checkDataGaps(pattern);
  insights.push(...dataGapInsights);

  return insights;
}

function analyzeVitalSigns(vitalSigns: any[], residentId: string, residentName: string) {
  const insights = [];
  const recent = vitalSigns.slice(-7); // Last 7 readings
  
  // Blood pressure analysis
  const highBP = recent.filter(vs => vs.systolic_pressure > 160 || vs.diastolic_pressure > 100);
  if (highBP.length > 3) {
    insights.push({
      type: "alert",
      severity: "high",
      title: "Padrão de Pressão Arterial Elevada",
      description: `${residentName} apresenta leituras consistentemente elevadas de pressão arterial nas medições recentes.`,
      recommendations: [
        "Monitorar pressão arterial com maior frequência",
        "Revisar medicações atuais com médico",
        "Avaliar sinais de crise hipertensiva",
        "Considerar redução de sódio na dieta"
      ],
      confidence: 0.85,
      dataPoints: highBP.length,
      timeframe: "7_days",
      metadata: {
        residentId,
        residentName,
        affectedSystems: ["cardiovascular"],
        trendDirection: "increasing",
        urgency: "within_24h"
      }
    });
  }

  // Oxygen saturation analysis
  const lowO2 = recent.filter(vs => vs.oxygen_saturation < 92);
  if (lowO2.length > 2) {
    insights.push({
      type: "alert",
      severity: "critical",
      title: "Baixa Saturação de Oxigênio",
      description: `${residentName} apresenta múltiplas leituras com saturação de oxigênio abaixo de 92%.`,
      recommendations: [
        "Avaliação médica imediata necessária",
        "Considerar oxigênio suplementar",
        "Monitorar status respiratório de perto",
        "Verificar sinais de desconforto respiratório"
      ],
      confidence: 0.95,
      dataPoints: lowO2.length,
      timeframe: "7_days",
      metadata: {
        residentId,
        residentName,
        affectedSystems: ["respiratory"],
        trendDirection: "decreasing",
        urgency: "immediate"
      }
    });
  }

  // Temperature analysis
  const fever = recent.filter(vs => vs.temperature > 38.0);
  if (fever.length > 1) {
    insights.push({
      type: "alert",
      severity: "medium",
      title: "Padrão de Febre Detectado",
      description: `${residentName} apresentou leituras elevadas de temperatura sugerindo possível infecção.`,
      recommendations: [
        "Monitorar sinais de infecção",
        "Considerar exames laboratoriais e culturas",
        "Garantir hidratação adequada",
        "Revisar possíveis fontes de infecção"
      ],
      confidence: 0.80,
      dataPoints: fever.length,
      timeframe: "7_days",
      metadata: {
        residentId,
        residentName,
        affectedSystems: ["immune"],
        trendDirection: "increasing",
        urgency: "within_24h"
      }
    });
  }

  return insights;
}

function analyzeIntercurrences(intercurrences: any[], residentId: string, residentName: string) {
  const insights = [];
  const recent = intercurrences.filter(i => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(i.occurred_at) > sevenDaysAgo;
  });

  // Fall risk analysis
  const falls = recent.filter(i => i.type === 'fall');
  if (falls.length > 0) {
    insights.push({
      type: "alert",
      severity: "high",
      title: "Avaliação de Risco de Queda Necessária",
      description: `${residentName} sofreu ${falls.length} queda(s) na última semana.`,
      recommendations: [
        "Avaliação abrangente de risco de queda",
        "Revisar auxílios de mobilidade e ambiente",
        "Considerar avaliação de fisioterapia",
        "Implementar medidas de segurança adicionais"
      ],
      confidence: 0.90,
      dataPoints: falls.length,
      timeframe: "7_days",
      metadata: {
        residentId,
        residentName,
        affectedSystems: ["musculoskeletal", "neurological"],
        trendDirection: "increasing",
        urgency: "within_24h"
      }
    });
  }

  // Behavioral changes
  const behavioral = recent.filter(i => i.type === 'behavioral_change');
  if (behavioral.length > 2) {
    insights.push({
      type: "recommendation",
      severity: "medium",
      title: "Mudanças no Padrão Comportamental",
      description: `${residentName} apresenta múltiplas mudanças comportamentais que podem indicar problemas subjacentes.`,
      recommendations: [
        "Avaliar dor ou desconforto",
        "Revisar efeitos colaterais de medicações",
        "Considerar avaliação cognitiva",
        "Implementar estratégias de intervenção comportamental"
      ],
      confidence: 0.75,
      dataPoints: behavioral.length,
      timeframe: "7_days",
      metadata: {
        residentId,
        residentName,
        affectedSystems: ["neurological", "psychological"],
        trendDirection: "increasing",
        urgency: "within_week"
      }
    });
  }

  return insights;
}

function analyzeEliminationPatterns(records: any[], residentId: string, residentName: string) {
  const insights = [];
  const recent = records.filter(r => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(r.recorded_at) > sevenDaysAgo;
  });

  // Constipation analysis
  const evacuation = recent.filter(r => r.type === 'evacuation');
  if (evacuation.length < 3) { // Less than 3 bowel movements in 7 days
    insights.push({
      type: "alert",
      severity: "medium",
      title: "Possível Constipação",
      description: `${residentName} teve apenas ${evacuation.length} evacuações na última semana.`,
      recommendations: [
        "Aumentar ingestão de líquidos",
        "Revisar conteúdo de fibras na dieta",
        "Considerar laxantes se apropriado",
        "Monitorar sinais de impactação"
      ],
      confidence: 0.80,
      dataPoints: evacuation.length,
      timeframe: "7_days",
      metadata: {
        residentId,
        residentName,
        affectedSystems: ["gastrointestinal"],
        trendDirection: "decreasing",
        urgency: "within_week"
      }
    });
  }

  return insights;
}

function checkDataGaps(pattern: any) {
  const insights = [];
  const { residentId, residentName, vitalSigns, intercurrences, eliminationRecords } = pattern;

  // Check for lack of recent vital signs
  if (vitalSigns.length === 0) {
    insights.push({
      type: "recommendation",
      severity: "low",
      title: "Dados de Sinais Vitais Ausentes",
      description: `Nenhum sinal vital registrado para ${residentName} nos últimos 30 dias.`,
      recommendations: [
        "Agendar monitoramento rotineiro de sinais vitais",
        "Garantir conformidade da equipe com protocolos de monitoramento",
        "Considerar requisitos do plano de cuidados do residente"
      ],
      confidence: 1.0,
      dataPoints: 0,
      timeframe: "30_days",
      metadata: {
        residentId,
        residentName,
        affectedSystems: ["monitoring"],
        trendDirection: "stable",
        urgency: "routine"
      }
    });
  }

  return insights;
}

function calculateRiskFactors(pattern: any) {
  let score = 0;
  const factors = [];

  // Age factor
  if (pattern.age > 85) {
    score += 0.2;
    factors.push("advanced_age");
  }

  // Health status
  if (pattern.healthStatus === 'critical') {
    score += 0.4;
    factors.push("critical_health_status");
  } else if (pattern.healthStatus === 'attention') {
    score += 0.2;
    factors.push("attention_required");
  }

  // Recent intercurrences
  const recentIntercurrences = pattern.intercurrences.filter((i: any) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(i.occurred_at) > sevenDaysAgo;
  });

  if (recentIntercurrences.length > 2) {
    score += 0.3;
    factors.push("multiple_recent_incidents");
  }

  // Vital signs concerns
  const recentVitals = pattern.vitalSigns.slice(-5);
  const criticalVitals = recentVitals.filter((vs: any) => 
    (vs.systolic_pressure && vs.systolic_pressure > 180) ||
    (vs.oxygen_saturation && vs.oxygen_saturation < 88) ||
    (vs.temperature && vs.temperature > 39.0)
  );

  if (criticalVitals.length > 0) {
    score += 0.4;
    factors.push("critical_vital_signs");
  }

  return {
    score: Math.min(score, 1.0), // Cap at 1.0
    factors
  };
}

async function saveInsights(supabase: any, userId: string, aiResponse: any, healthData: any[]) {
  const notifications = aiResponse.insights.map((insight: any) => ({
    user_id: userId,
    type: mapSeverityToNotificationType(insight.severity),
    category: 'ai',
    title: insight.title,
    message: insight.description,
    timestamp: new Date().toISOString(),
    read: false,
    priority: insight.severity === 'critical' ? 'high' : insight.severity === 'high' ? 'high' : 'medium',
    source: 'ai',
    resident_id: insight.metadata?.residentId || null,
    resident_name: insight.metadata?.residentName || null,
    metadata: {
      ...insight.metadata,
      confidence: insight.confidence,
      dataPoints: insight.dataPoints,
      recommendations: insight.recommendations,
      aiAnalysisId: `ai_${Date.now()}`,
      analysisDate: new Date().toISOString()
    }
  }));

  // Insert notifications to database
  if (notifications.length > 0) {
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error saving insights:', error);
      throw error;
    }
  }
}

function mapSeverityToNotificationType(severity: string): 'critical' | 'warning' | 'info' | 'success' {
  switch (severity) {
    case 'critical': return 'critical';
    case 'high': return 'warning';
    case 'medium': return 'warning';
    case 'low': return 'info';
    default: return 'info';
  }
}

function summarizeVitalSigns(vitalSigns: any[]) {
  if (vitalSigns.length === 0) return null;

  const calculateAverage = (data: any[], field: string) => {
    const values = data.filter(d => d[field] !== null && d[field] !== undefined).map(d => d[field]);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };

  // Split into recent and older
  const recent = vitalSigns.slice(-Math.min(7, vitalSigns.length));
  const older = vitalSigns.slice(0, Math.min(7, vitalSigns.length));

  return {
    systolicPressure: {
      recent: calculateAverage(recent, 'systolic_pressure'),
      older: calculateAverage(older, 'systolic_pressure')
    },
    diastolicPressure: {
      recent: calculateAverage(recent, 'diastolic_pressure'),
      older: calculateAverage(older, 'diastolic_pressure')
    },
    oxygenSaturation: {
      recent: calculateAverage(recent, 'oxygen_saturation'),
      older: calculateAverage(older, 'oxygen_saturation')
    },
    heartRate: {
      recent: calculateAverage(recent, 'heart_rate'),
      older: calculateAverage(older, 'heart_rate')
    },
    temperature: {
      recent: calculateAverage(recent, 'temperature'),
      older: calculateAverage(older, 'temperature')
    },
    glucose: {
      recent: calculateAverage(recent, 'glucose'),
      older: calculateAverage(older, 'glucose')
    },
    readings: vitalSigns.length
  };
}

function summarizeIntercurrences(intercurrences: any[]) {
  if (intercurrences.length === 0) return null;

  // Group by type and severity
  const byType = intercurrences.reduce((acc, inter) => {
    acc[inter.type] = (acc[inter.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bySeverity = intercurrences.reduce((acc, inter) => {
    acc[inter.severity] = (acc[inter.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get most recent
  const mostRecent = intercurrences.sort((a, b) => 
    new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  )[0];

  return {
    byType,
    bySeverity,
    mostRecent: {
      type: mostRecent.type,
      severity: mostRecent.severity,
      description: mostRecent.description,
      date: mostRecent.occurred_at
    },
    total: intercurrences.length
  };
}

function summarizeElimination(records: any[]) {
  if (records.length === 0) return null;

  const evacuation = records.filter(r => r.type === 'evacuation');
  const urine = records.filter(r => r.type === 'urine');

  // Calculate averages
  const avgUrineVolume = urine.length > 0 
    ? urine.reduce((sum, r) => sum + (r.urine_volume || 0), 0) / urine.length 
    : 0;

  // Get most common values
  const getMostCommon = (array: any[], field: string) => {
    const counts = array.reduce((acc, item) => {
      const value = item[field];
      if (value) acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts).length > 0
      ? Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '')
      : null;
  };

  return {
    evacuation: {
      count: evacuation.length,
      frequency: evacuation.length / 30, // per day
      mostCommonConsistency: getMostCommon(evacuation, 'evacuation_consistency')
    },
    urine: {
      count: urine.length,
      frequency: urine.length / 30, // per day
      avgVolume: avgUrineVolume,
      mostCommonColor: getMostCommon(urine, 'urine_color')
    }
  };
}

function identifyCriticalEvents(pattern: any) {
  const events = [];

  // Critical intercurrences
  const criticalIntercurrences = pattern.intercurrences.filter(
    (i: any) => i.severity === 'critical' || i.severity === 'severe'
  );
  
  if (criticalIntercurrences.length > 0) {
    events.push({
      type: 'intercurrence',
      severity: criticalIntercurrences[0].severity,
      description: criticalIntercurrences[0].description,
      date: criticalIntercurrences[0].occurred_at
    });
  }

  // Critical vital signs
  const criticalVitals = pattern.vitalSigns.filter((vs: any) => 
    (vs.systolic_pressure && vs.systolic_pressure > 180) ||
    (vs.oxygen_saturation && vs.oxygen_saturation < 88) ||
    (vs.temperature && vs.temperature > 39.0) ||
    (vs.glucose && vs.glucose > 300)
  );
  
  if (criticalVitals.length > 0) {
    events.push({
      type: 'vital_signs',
      values: {
        systolic: criticalVitals[0].systolic_pressure,
        diastolic: criticalVitals[0].diastolic_pressure,
        oxygen: criticalVitals[0].oxygen_saturation,
        temperature: criticalVitals[0].temperature,
        glucose: criticalVitals[0].glucose
      },
      date: criticalVitals[0].recorded_at
    });
  }

  return events.length > 0 ? events : null;
}

// Import createClient at the top
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
