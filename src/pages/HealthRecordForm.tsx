import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Save, 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  MessageSquare, 
  Activity, 
  Droplets, 
  AlertTriangle,
  Thermometer,
  Zap,
  Clipboard
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useHealth } from '../contexts/HealthContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type RecordType = 'vital-signs' | 'elimination' | 'intercurrence';

interface HealthRecordFormData {
  residentId: string;
  recordType: RecordType;
  recordedAt: string;
  
  // Vital Signs
  systolicPressure?: number;
  diastolicPressure?: number;
  oxygenSaturation?: number;
  glucose?: number;
  heartRate?: number;
  temperature?: number;
  
  // Elimination
  eliminationType?: 'evacuation' | 'urine';
  evacuationCount?: number;
  evacuationConsistency?: 'solid' | 'soft' | 'liquid' | 'hard' | 'other';
  urineVolume?: number;
  urineColor?: 'clear' | 'yellow' | 'dark_yellow' | 'amber' | 'brown' | 'red' | 'other';
  
  // Intercurrence
  intercurrenceType?: 'fainting' | 'vomiting' | 'fall' | 'seizure' | 'pain' | 'breathing_difficulty' | 'skin_injury' | 'behavioral_change' | 'other';
  description?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  actionsTaken?: string;
  outcome?: string;
  
  // Common
  observations: string;
}

const initialFormData: HealthRecordFormData = {
  residentId: '',
  recordType: 'vital-signs',
  recordedAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm
  observations: ''
};

export const HealthRecordForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { residents } = useApp();
  const { 
    vitalSigns, 
    eliminationRecords, 
    intercurrences,
    addVitalSigns,
    updateVitalSigns,
    addEliminationRecord,
    updateEliminationRecord,
    addIntercurrence,
    updateIntercurrence,
    isLoading,
    connectionError
  } = useHealth();
  
  const [formData, setFormData] = useState<HealthRecordFormData>({
    ...initialFormData,
    recordedAt: new Date().toISOString().slice(0, 16) // Ensure current date/time is set
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidUrlParam, setInvalidUrlParam] = useState(false);

  const isEditMode = !!id;
  
  // Parse the ID and record type from the URL parameter
  let recordTypeId = '';
  let recordTypeFromUrl: RecordType = 'vital-signs';
  
  // Parse URL parameter only once and handle errors properly
  if (id && !invalidUrlParam) {
    console.log('Raw ID parameter:', id);
    
    // For vital-signs, we need to find the pattern: UUID-vital-signs
    // For other types: UUID-elimination or UUID-intercurrence
    let lastHyphenIndex = -1;
    let typePart = '';
    
    if (id.includes('-vital-signs')) {
      // Handle vital-signs case specifically
      lastHyphenIndex = id.lastIndexOf('-vital-signs');
      if (lastHyphenIndex !== -1) {
        recordTypeId = id.substring(0, lastHyphenIndex);
        typePart = 'vital-signs';
      }
    } else {
      // Handle other cases (elimination, intercurrence)
      lastHyphenIndex = id.lastIndexOf('-');
      if (lastHyphenIndex !== -1) {
        recordTypeId = id.substring(0, lastHyphenIndex);
        typePart = id.substring(lastHyphenIndex + 1);
      }
    }
    
    console.log('Parsed recordTypeId:', recordTypeId);
    console.log('Parsed typePart:', typePart);
    
    // Validate that the type part is a valid record type
    if (['vital-signs', 'elimination', 'intercurrence'].includes(typePart)) {
      recordTypeFromUrl = typePart as RecordType;
    } else {
      console.error(`Invalid record type in URL: ${typePart}`);
      setInvalidUrlParam(true);
      setError(`Tipo de registro inválido: ${typePart}`);
      // Redirect after a short delay to prevent infinite loop
      setTimeout(() => {
        navigate('/health-records');
      }, 2000);
    }
    
    if (lastHyphenIndex === -1) {
      console.error('Invalid ID format in URL, missing hyphen:', id);
      setInvalidUrlParam(true);
      setError('Formato de ID inválido. O formato esperado é "id-tipo".');
      // Redirect after a short delay to prevent infinite loop
      setTimeout(() => {
        navigate('/health-records');
      }, 2000);
    }
  }

  // Load health record data if in edit mode
  useEffect(() => {
    if (isEditMode && recordTypeId && !error && !invalidUrlParam) {
      console.log('Loading record data for edit mode:', { recordTypeId, recordTypeFromUrl });
      
      // Set the record type based on the URL parameter
      setFormData(prev => ({ ...prev, recordType: recordTypeFromUrl }));
      
      if (recordTypeFromUrl === 'vital-signs') {
        const record = vitalSigns.find(vs => vs.id === recordTypeId);
        console.log('Found vital signs record:', record);
        
        if (record) {
          setFormData({
            residentId: record.residentId,
            recordType: 'vital-signs',
            recordedAt: record.recordedAt.slice(0, 16), // YYYY-MM-DDThh:mm
            systolicPressure: record.systolicPressure,
            diastolicPressure: record.diastolicPressure,
            oxygenSaturation: record.oxygenSaturation,
            glucose: record.glucose,
            heartRate: record.heartRate,
            temperature: record.temperature,
            observations: record.observations || ''
          });
        } else if (vitalSigns.length > 0) {
          // Only set error if we have loaded data but record not found
          setError('Registro de sinais vitais não encontrado');
          setTimeout(() => {
            navigate('/health-records');
          }, 2000);
        }
      } else if (recordTypeFromUrl === 'elimination') {
        const record = eliminationRecords.find(er => er.id === recordTypeId);
        console.log('Found elimination record:', record);
        
        if (record) {
          setFormData({
            residentId: record.residentId,
            recordType: 'elimination',
            recordedAt: record.recordedAt.slice(0, 16), // YYYY-MM-DDThh:mm
            eliminationType: record.type,
            evacuationCount: record.evacuationCount,
            evacuationConsistency: record.evacuationConsistency,
            urineVolume: record.urineVolume,
            urineColor: record.urineColor,
            observations: record.observations || ''
          });
        } else if (eliminationRecords.length > 0) {
          // Only set error if we have loaded data but record not found
          setError('Registro de eliminação não encontrado');
          setTimeout(() => {
            navigate('/health-records');
          }, 2000);
        }
      } else if (recordTypeFromUrl === 'intercurrence') {
        const record = intercurrences.find(i => i.id === recordTypeId);
        console.log('Found intercurrence record:', record);
        
        if (record) {
          setFormData({
            residentId: record.residentId,
            recordType: 'intercurrence',
            recordedAt: record.occurredAt.slice(0, 16), // YYYY-MM-DDThh:mm
            intercurrenceType: record.type,
            description: record.description,
            severity: record.severity,
            actionsTaken: record.actionsTaken,
            outcome: record.outcome,
            observations: record.observations || ''
          });
        } else if (intercurrences.length > 0) {
          // Only set error if we have loaded data but record not found
          setError('Registro de intercorrência não encontrado');
          setTimeout(() => {
            navigate('/health-records');
          }, 2000);
        }
      }
    }
  }, [id, recordTypeId, recordTypeFromUrl, vitalSigns, eliminationRecords, intercurrences, isEditMode, error, invalidUrlParam, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      // Handle number inputs
      const numValue = value === '' ? undefined : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      // Handle other inputs
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRecordTypeChange = (type: RecordType) => {
    setFormData(prev => ({ ...prev, recordType: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.residentId) {
      setError('Selecione um residente');
      return;
    }

    if (!formData.recordedAt) {
      setError('Selecione uma data e hora');
      return;
    }

    // Validate specific fields based on record type
    if (formData.recordType === 'vital-signs') {
      if (!formData.systolicPressure && !formData.diastolicPressure && 
          !formData.oxygenSaturation && !formData.glucose && 
          !formData.heartRate && !formData.temperature) {
        setError('Preencha pelo menos um sinal vital');
        return;
      }
    } else if (formData.recordType === 'elimination') {
      if (!formData.eliminationType) {
        setError('Selecione o tipo de eliminação');
        return;
      }
      if (formData.eliminationType === 'evacuation' && !formData.evacuationCount) {
        setError('Informe a quantidade de evacuações');
        return;
      }
      if (formData.eliminationType === 'urine' && !formData.urineVolume) {
        setError('Informe o volume de urina');
        return;
      }
    } else if (formData.recordType === 'intercurrence') {
      if (!formData.intercurrenceType) {
        setError('Selecione o tipo de intercorrência');
        return;
      }
      if (!formData.description) {
        setError('Descreva a intercorrência');
        return;
      }
      if (!formData.severity) {
        setError('Selecione a severidade');
        return;
      }
    }

    setIsSaving(true);
    
    try {
      if (formData.recordType === 'vital-signs') {
        if (isEditMode && recordTypeId) {
          await updateVitalSigns(recordTypeId, {
            residentId: formData.residentId,
            systolicPressure: formData.systolicPressure,
            diastolicPressure: formData.diastolicPressure,
            oxygenSaturation: formData.oxygenSaturation,
            glucose: formData.glucose,
            heartRate: formData.heartRate,
            temperature: formData.temperature,
            recordedAt: formData.recordedAt,
            observations: formData.observations
          });
        } else {
          await addVitalSigns({
            residentId: formData.residentId,
            systolicPressure: formData.systolicPressure,
            diastolicPressure: formData.diastolicPressure,
            oxygenSaturation: formData.oxygenSaturation,
            glucose: formData.glucose,
            heartRate: formData.heartRate,
            temperature: formData.temperature,
            recordedAt: formData.recordedAt,
            observations: formData.observations
          });
        }
      } else if (formData.recordType === 'elimination') {
        if (isEditMode && recordTypeId) {
          await updateEliminationRecord(recordTypeId, {
            residentId: formData.residentId,
            type: formData.eliminationType!,
            recordedAt: formData.recordedAt,
            evacuationCount: formData.eliminationType === 'evacuation' ? formData.evacuationCount : undefined,
            evacuationConsistency: formData.eliminationType === 'evacuation' ? formData.evacuationConsistency : undefined,
            urineVolume: formData.eliminationType === 'urine' ? formData.urineVolume : undefined,
            urineColor: formData.eliminationType === 'urine' ? formData.urineColor : undefined,
            observations: formData.observations
          });
        } else {
          await addEliminationRecord({
            residentId: formData.residentId,
            type: formData.eliminationType!,
            recordedAt: formData.recordedAt,
            evacuationCount: formData.eliminationType === 'evacuation' ? formData.evacuationCount : undefined,
            evacuationConsistency: formData.eliminationType === 'evacuation' ? formData.evacuationConsistency : undefined,
            urineVolume: formData.eliminationType === 'urine' ? formData.urineVolume : undefined,
            urineColor: formData.eliminationType === 'urine' ? formData.urineColor : undefined,
            observations: formData.observations
          });
        }
      } else if (formData.recordType === 'intercurrence') {
        if (isEditMode && recordTypeId) {
          await updateIntercurrence(recordTypeId, {
            residentId: formData.residentId,
            type: formData.intercurrenceType!,
            description: formData.description!,
            severity: formData.severity!,
            actionsTaken: formData.actionsTaken,
            outcome: formData.outcome,
            occurredAt: formData.recordedAt,
            observations: formData.observations
          });
        } else {
          await addIntercurrence({
            residentId: formData.residentId,
            type: formData.intercurrenceType!,
            description: formData.description!,
            severity: formData.severity!,
            actionsTaken: formData.actionsTaken,
            outcome: formData.outcome,
            occurredAt: formData.recordedAt,
            observations: formData.observations
          });
        }
      }

      // Navigate back to health records list
      navigate('/health-records');
    } catch (error) {
      console.error('Error saving health record:', error);
      setError('Erro ao salvar registro de saúde. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar Registro de Saúde' : 'Novo Registro de Saúde'}
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium">Erro de conexão</h3>
              <p>{connectionError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if URL parameter is invalid
  if (invalidUrlParam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar Registro de Saúde' : 'Novo Registro de Saúde'}
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium">Erro no parâmetro da URL</h3>
              <p>{error}</p>
              <p className="mt-2 text-sm">Redirecionando para a lista de registros...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Editar Registro de Saúde' : 'Novo Registro de Saúde'}
        </h1>
        <button
          onClick={() => navigate('/health-records')}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
      </div>

      {/* Error Message */}
      {error && !invalidUrlParam && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Common Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Clipboard className="w-5 h-5 mr-2 text-blue-600" />
              Informações Básicas
            </h3>
            <div className="space-y-6 max-w-4xl">
              {/* Residente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Residente *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="residentId"
                    value={formData.residentId}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um residente</option>
                    {residents.map(resident => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name} - Quarto {resident.room}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Data e Hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data e Hora *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="datetime-local"
                    name="recordedAt"
                    value={formData.recordedAt}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Tipo de Registro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Registro *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => handleRecordTypeChange('vital-signs')}
                    className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                      formData.recordType === 'vital-signs' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Activity className={`w-5 h-5 ${formData.recordType === 'vital-signs' ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-medium">Sinais Vitais</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRecordTypeChange('elimination')}
                    className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                      formData.recordType === 'elimination' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Droplets className={`w-5 h-5 ${formData.recordType === 'elimination' ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className="font-medium">Eliminação</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRecordTypeChange('intercurrence')}
                    className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                      formData.recordType === 'intercurrence' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 ${formData.recordType === 'intercurrence' ? 'text-red-600' : 'text-gray-500'}`} />
                    <span className="font-medium">Intercorrência</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Specific Fields Based on Record Type */}
          {formData.recordType === 'vital-signs' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Sinais Vitais
              </h3>
              <div className="space-y-6 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pressão Arterial */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pressão Arterial (mmHg)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        name="systolicPressure"
                        value={formData.systolicPressure || ''}
                        onChange={handleInputChange}
                        placeholder="Sistólica"
                        min="60"
                        max="300"
                        className="w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        name="diastolicPressure"
                        value={formData.diastolicPressure || ''}
                        onChange={handleInputChange}
                        placeholder="Diastólica"
                        min="40"
                        max="200"
                        className="w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Saturação de Oxigênio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saturação de Oxigênio (%)
                    </label>
                    <input
                      type="number"
                      name="oxygenSaturation"
                      value={formData.oxygenSaturation || ''}
                      onChange={handleInputChange}
                      placeholder="Ex: 98.5"
                      min="70"
                      max="100"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Glicose */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Glicose (mg/dL)
                    </label>
                    <input
                      type="number"
                      name="glucose"
                      value={formData.glucose || ''}
                      onChange={handleInputChange}
                      placeholder="Ex: 110"
                      min="40"
                      max="600"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Frequência Cardíaca */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência Cardíaca (bpm)
                    </label>
                    <input
                      type="number"
                      name="heartRate"
                      value={formData.heartRate || ''}
                      onChange={handleInputChange}
                      placeholder="Ex: 75"
                      min="40"
                      max="200"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Temperatura */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperatura (°C)
                    </label>
                    <div className="relative">
                      <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        name="temperature"
                        value={formData.temperature || ''}
                        onChange={handleInputChange}
                        placeholder="Ex: 36.5"
                        min="30"
                        max="45"
                        step="0.1"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData.recordType === 'elimination' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <Droplets className="w-5 h-5 mr-2 text-green-600" />
                Registro de Eliminação
              </h3>
              <div className="space-y-6 max-w-4xl">
                {/* Tipo de Eliminação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Eliminação *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, eliminationType: 'evacuation' }))}
                      className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                        formData.eliminationType === 'evacuation' 
                          ? 'border-amber-500 bg-amber-50 text-amber-700' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">Evacuação</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, eliminationType: 'urine' }))}
                      className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                        formData.eliminationType === 'urine' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">Urina</span>
                    </button>
                  </div>
                </div>
                
                {/* Fields for Evacuation */}
                {formData.eliminationType === 'evacuation' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade de Evacuações *
                      </label>
                      <input
                        type="number"
                        name="evacuationCount"
                        value={formData.evacuationCount || ''}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="10"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Consistência
                      </label>
                      <select
                        name="evacuationConsistency"
                        value={formData.evacuationConsistency || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione a consistência</option>
                        <option value="solid">Sólida</option>
                        <option value="soft">Pastosa</option>
                        <option value="liquid">Líquida</option>
                        <option value="hard">Endurecida</option>
                        <option value="other">Outra</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Fields for Urine */}
                {formData.eliminationType === 'urine' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Volume (ml) *
                      </label>
                      <input
                        type="number"
                        name="urineVolume"
                        value={formData.urineVolume || ''}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="2000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cor
                      </label>
                      <select
                        name="urineColor"
                        value={formData.urineColor || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione a cor</option>
                        <option value="clear">Clara</option>
                        <option value="yellow">Amarela</option>
                        <option value="dark_yellow">Amarelo Escuro</option>
                        <option value="amber">Âmbar</option>
                        <option value="brown">Marrom</option>
                        <option value="red">Avermelhada</option>
                        <option value="other">Outra</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.recordType === 'intercurrence' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Registro de Intercorrência
              </h3>
              <div className="space-y-6 max-w-4xl">
                {/* Tipo de Intercorrência */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Intercorrência *
                  </label>
                  <select
                    name="intercurrenceType"
                    value={formData.intercurrenceType || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="fainting">Desmaio</option>
                    <option value="vomiting">Vômito</option>
                    <option value="fall">Queda</option>
                    <option value="seizure">Convulsão</option>
                    <option value="pain">Dor</option>
                    <option value="breathing_difficulty">Dificuldade Respiratória</option>
                    <option value="skin_injury">Lesão de Pele</option>
                    <option value="behavioral_change">Alteração Comportamental</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                
                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva detalhadamente a intercorrência..."
                  />
                </div>
                
                {/* Severidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severidade *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity: 'mild' }))}
                      className={`flex items-center justify-center space-x-2 p-3 border rounded-lg transition-colors ${
                        formData.severity === 'mild' 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">Leve</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity: 'moderate' }))}
                      className={`flex items-center justify-center space-x-2 p-3 border rounded-lg transition-colors ${
                        formData.severity === 'moderate' 
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">Moderada</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity: 'severe' }))}
                      className={`flex items-center justify-center space-x-2 p-3 border rounded-lg transition-colors ${
                        formData.severity === 'severe' 
                          ? 'border-orange-500 bg-orange-50 text-orange-700' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">Grave</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity: 'critical' }))}
                      className={`flex items-center justify-center space-x-2 p-3 border rounded-lg transition-colors ${
                        formData.severity === 'critical' 
                          ? 'border-red-500 bg-red-50 text-red-700' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">Crítica</span>
                    </button>
                  </div>
                </div>
                
                {/* Ações Tomadas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ações Tomadas
                  </label>
                  <textarea
                    name="actionsTaken"
                    value={formData.actionsTaken || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva as ações tomadas para resolver a situação..."
                  />
                </div>
                
                {/* Desfecho */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desfecho
                  </label>
                  <textarea
                    name="outcome"
                    value={formData.outcome || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva o resultado das ações tomadas..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Observações - Common for all record types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleInputChange}
                rows={4}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações adicionais sobre o registro..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/health-records')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditMode ? 'Salvar Alterações' : 'Adicionar Registro'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
