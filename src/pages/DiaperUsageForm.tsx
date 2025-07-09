import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Footprints, 
  Save, 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DiaperUsageFormData {
  residentId: string;
  date: string;
  quantity: number;
  shift: 'morning' | 'afternoon' | 'night';
  observations: string;
  diaperTypeId: string;
}

const initialFormData: DiaperUsageFormData = {
  residentId: '',
  date: new Date().toISOString().split('T')[0],
  quantity: 1,
  shift: 'morning',
  observations: '',
  diaperTypeId: ''
};

export const DiaperUsageForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    residents, 
    diaperUsages, 
    diaperTypes, 
    addDiaperUsage, 
    updateDiaperUsage, 
    isLoading,
    connectionError 
  } = useApp();
  
  const [formData, setFormData] = useState<DiaperUsageFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!id;

  // Load diaper usage data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const diaperUsage = diaperUsages.find(d => d.id === id);
      if (diaperUsage) {
        setFormData({
          residentId: diaperUsage.residentId,
          date: diaperUsage.date,
          quantity: diaperUsage.quantity,
          shift: diaperUsage.shift,
          observations: diaperUsage.observations || '',
          diaperTypeId: diaperUsage.diaperTypeId || ''
        });
      } else {
        setError('Registro de uso de fralda não encontrado');
      }
    }
  }, [id, diaperUsages, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity') {
      // Ensure quantity is a positive integer
      const quantity = parseInt(value);
      if (isNaN(quantity) || quantity < 1) return;
      
      setFormData(prev => ({ ...prev, [name]: quantity }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.residentId) {
      setError('Selecione um residente');
      return;
    }

    if (!formData.date) {
      setError('Selecione uma data');
      return;
    }

    if (!formData.diaperTypeId) {
      setError('Selecione um tipo de fralda');
      return;
    }

    setIsSaving(true);
    
    try {
      if (isEditMode && id) {
        await updateDiaperUsage(id, {
          residentId: formData.residentId,
          date: formData.date,
          quantity: formData.quantity,
          shift: formData.shift,
          observations: formData.observations || undefined,
          diaperTypeId: formData.diaperTypeId
        });
      } else {
        await addDiaperUsage({
          residentId: formData.residentId,
          date: formData.date,
          quantity: formData.quantity,
          shift: formData.shift,
          observations: formData.observations || undefined,
          diaperTypeId: formData.diaperTypeId
        });
      }

      // Navigate back to diaper usage list
      navigate('/diaper-usage');
    } catch (error) {
      console.error('Error saving diaper usage:', error);
      setError('Erro ao salvar registro de uso de fralda. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const getResidentName = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    return resident ? resident.name : 'Residente não encontrado';
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
            {isEditMode ? 'Editar Registro de Uso de Fralda' : 'Novo Registro de Uso de Fralda'}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Editar Registro de Uso de Fralda' : 'Novo Registro de Uso de Fralda'}
        </h1>
        <button
          onClick={() => navigate('/diaper-usage')}
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

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Footprints className="w-5 h-5 mr-2 text-blue-600" />
              Informações do Uso de Fralda
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
              
              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Quantidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Turno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turno *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="morning">Manhã</option>
                    <option value="afternoon">Tarde</option>
                    <option value="night">Noite</option>
                  </select>
                </div>
              </div>
              
              {/* Tipo de Fralda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Fralda *
                </label>
                <select
                  name="diaperTypeId"
                  value={formData.diaperTypeId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um tipo de fralda</option>
                  {diaperTypes.filter(dt => dt.isActive).map(type => {
                    // Build the display string conditionally
                    let displayText = type.name;
                    
                    // Add brand if it exists
                    if (type.brand) {
                      displayText += ` - ${type.brand}`;
                    }
                    
                    // Add size in parentheses only if it exists
                    if (type.size) {
                      displayText += ` (${type.size})`;
                    }
                    
                    return (
                      <option key={type.id} value={type.id}>
                        {displayText}
                      </option>
                    );
                  })}
                </select>
                {diaperTypes.length === 0 && (
                  <p className="mt-1 text-sm text-red-500">
                    Nenhum tipo de fralda cadastrado. Peça ao administrador para cadastrar tipos de fraldas.
                  </p>
                )}
              </div>
              
              {/* Observações */}
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
                    placeholder="Observações adicionais sobre o uso de fraldas..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/diaper-usage')}
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
