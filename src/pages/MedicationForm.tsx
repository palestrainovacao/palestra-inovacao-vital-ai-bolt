import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pill, Save, ArrowLeft, Clock, User, Calendar, Plus, X, FileText, MessageSquare, Check, Search } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Medication } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MedicationFormData {
  name: string;
  dosage: string;
  time: string[];
  residentId: string;
  prescribedBy: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused';
  observations: string;
  medicalPrescriptionUrl: string;
}

const initialFormData: MedicationFormData = {
  name: '',
  dosage: '',
  time: [],
  residentId: '',
  prescribedBy: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  status: 'active',
  observations: '',
  medicalPrescriptionUrl: ''
};

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

export const MedicationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { residents, medications, medicationNames, addMedication, updateMedication, addMedicationName, isLoading } = useApp();
  const [formData, setFormData] = useState<MedicationFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState('08:00');
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newMedicationAdded, setNewMedicationAdded] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const isEditMode = !!id;

  // Load medication data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const medication = medications.find(m => m.id === id);
      if (medication) {
        setFormData({
          name: medication.name,
          dosage: medication.dosage,
          time: medication.time,
          residentId: medication.residentId,
          prescribedBy: medication.prescribedBy,
          startDate: medication.startDate,
          endDate: medication.endDate || '',
          status: medication.status,
          observations: medication.observations || '',
          medicalPrescriptionUrl: medication.medicalPrescriptionUrl || ''
        });
        setSearchTerm(medication.name);
      } else {
        setError('Medicação não encontrada');
      }
    }
  }, [id, medications, isEditMode]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Hide success message after 3 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicationSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFormData(prev => ({ ...prev, name: value }));
    setShowSuggestions(true);
    setNewMedicationAdded(false);
  };

  const handleMedicationSelect = (name: string) => {
    setFormData(prev => ({ ...prev, name }));
    setSearchTerm(name);
    setShowSuggestions(false);
  };

  const handleAddNewMedication = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      await addMedicationName(searchTerm.trim());
      setNewMedicationAdded(true);
      setShowSuccessMessage(true);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error adding new medication:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileSelected(e.target.files[0]);
      // Note: In a real implementation, we would upload this file to Supabase Storage
      // and set the URL in formData.medicalPrescriptionUrl
      // For now, we'll just set a placeholder
      setFormData(prev => ({
        ...prev,
        medicalPrescriptionUrl: 'placeholder-url-for-' + e.target.files![0].name
      }));
    }
  };

  const handleAddTimeSlot = () => {
    if (!formData.time.includes(newTimeSlot)) {
      setFormData(prev => ({
        ...prev,
        time: [...prev.time, newTimeSlot].sort()
      }));
    }
  };

  const handleRemoveTimeSlot = (timeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      time: prev.time.filter(t => t !== timeToRemove)
    }));
  };

  // Calculate frequency based on time slots
  const calculateFrequency = (timeSlots: string[]) => {
    const count = timeSlots.length;
    if (count === 0) return '';
    if (count === 1) return '1x ao dia';
    if (count === 2) return '2x ao dia';
    if (count === 3) return '3x ao dia';
    if (count === 4) return '4x ao dia';
    return `${count}x ao dia`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (formData.time.length === 0) {
      setError('Adicione pelo menos um horário para a medicação.');
      return;
    }

    if (!formData.residentId) {
      setError('Selecione um residente para a medicação.');
      return;
    }

    setIsSaving(true);
    
    try {
      // In a real implementation, we would upload the file to Supabase Storage here
      // and get the URL to store in the database
      
      const medicationData: Omit<Medication, 'id'> = {
        name: formData.name,
        dosage: formData.dosage,
        time: formData.time,
        residentId: formData.residentId,
        prescribedBy: formData.prescribedBy,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: formData.status,
        observations: formData.observations || undefined,
        medicalPrescriptionUrl: formData.medicalPrescriptionUrl || undefined,
        frequency: calculateFrequency(formData.time)
      };

      if (isEditMode && id) {
        await updateMedication(id, medicationData);
      } else {
        await addMedication(medicationData);
      }

      // Navigate back to medications list
      navigate('/medications');
    } catch (error) {
      console.error('Error saving medication:', error);
      setError('Erro ao salvar medicação. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get unique medication names for dropdown
  const filteredMedicationNames = medicationNames
    .map(m => m.name)
    .filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort();

  // Remove duplicates
  const uniqueMedicationNames = Array.from(new Set(filteredMedicationNames));

  // Check if current search term is a new medication
  const isNewMedication = searchTerm.trim() !== '' && 
    !medicationNames.some(m => m.name.toLowerCase() === searchTerm.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Editar Medicação' : 'Nova Medicação'}
        </h1>
        <button
          onClick={() => navigate('/medications')}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message for new medication */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <Check className="w-5 h-5 mr-2" />
          <span>Novo medicamento adicionado com sucesso!</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Pill className="w-5 h-5 mr-2 text-blue-600" />
              Informações da Medicação
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
              
              {/* Nome do Medicamento - Autocomplete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Medicamento *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    name="name"
                    value={searchTerm}
                    onChange={handleMedicationSearch}
                    onFocus={() => setShowSuggestions(true)}
                    required
                    placeholder="Digite ou selecione um medicamento"
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      newMedicationAdded ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  />
                  
                  {showSuggestions && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                      {uniqueMedicationNames.length > 0 ? (
                        uniqueMedicationNames.map((name, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleMedicationSelect(name)}
                          >
                            {name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">Nenhum resultado encontrado</div>
                      )}
                      
                      {isNewMedication && (
                        <div 
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 cursor-pointer flex items-center text-blue-700"
                          onClick={handleAddNewMedication}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          <span>Adicionar "{searchTerm}" como novo medicamento</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Dosagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosagem *
                </label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: 50mg, 1 comprimido"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Prescrito por */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescrito por *
                </label>
                <input
                  type="text"
                  name="prescribedBy"
                  value={formData.prescribedBy}
                  onChange={handleInputChange}
                  required
                  placeholder="Nome do médico"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Horários de Administração */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-600" />
              Horários de Administração
            </h3>
            <div className="space-y-4 max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddTimeSlot}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Horário</span>
                </button>
                
                {formData.time.length > 0 && (
                  <div className="ml-4 bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm">
                    {calculateFrequency(formData.time)}
                  </div>
                )}
              </div>
              
              {formData.time.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Horários selecionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.time.map(time => (
                      <span
                        key={time}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {time}
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeSlot(time)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-500">
                  É necessário adicionar pelo menos um horário de administração.
                </div>
              )}
            </div>
          </div>

          {/* Período de Tratamento */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-600" />
              Período de Tratamento
            </h3>
            <div className="space-y-6 max-w-4xl">
              {/* Data de Início */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Data de Fim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim (opcional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Ativo</option>
                  <option value="paused">Pausado</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>
            </div>
          </div>

          {/* Observações e Receita Médica */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
              Observações e Documentação
            </h3>
            
            <div className="max-w-4xl space-y-6">
              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações/Instruções Especiais
                </label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Instruções especiais para administração, efeitos colaterais a monitorar, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Receita Médica */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anexar Receita Médica
                </label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer">
                    <FileText className="w-4 h-4" />
                    <span>Selecionar Arquivo</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {fileSelected && (
                    <span className="text-sm text-gray-600">
                      {fileSelected.name}
                    </span>
                  )}
                  {formData.medicalPrescriptionUrl && !fileSelected && (
                    <span className="text-sm text-gray-600">
                      Receita já anexada
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: PDF, JPG, JPEG, PNG (máx. 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/medications')}
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
                  <span>{isEditMode ? 'Salvar Alterações' : 'Adicionar Medicação'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
