import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Save, 
  ArrowLeft, 
  Package, 
  Tag, 
  Briefcase, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { currencyToNumber, formatCurrency } from '../utils/dateUtils';

interface DiaperTypeFormData {
  name: string;
  size: string;
  brand: string;
  unitCost: string;
  isActive: boolean;
}

const initialFormData: DiaperTypeFormData = {
  name: '',
  size: '',
  brand: '',
  unitCost: 'R$ 0,00',
  isActive: true
};

export const DiaperTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { diaperTypes, addDiaperType, updateDiaperType, isLoading } = useApp();
  
  const [formData, setFormData] = useState<DiaperTypeFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!id;

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setError('Apenas administradores podem gerenciar tipos de fraldas');
      navigate('/diaper-usage');
    }
  }, [user, navigate]);

  // Load diaper type data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const diaperType = diaperTypes.find(d => d.id === id);
      if (diaperType) {
        setFormData({
          name: diaperType.name,
          size: diaperType.size,
          brand: diaperType.brand,
          unitCost: formatCurrency(diaperType.unitCost.toString()),
          isActive: diaperType.isActive
        });
      } else {
        setError('Tipo de fralda não encontrado');
      }
    }
  }, [id, diaperTypes, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'unitCost') {
      // Format as currency
      setFormData(prev => ({ 
        ...prev, 
        [name]: formatCurrency(value.replace(/[^\d]/g, ''))
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    const unitCost = currencyToNumber(formData.unitCost);
    if (isNaN(unitCost) || unitCost <= 0) {
      setError('Custo unitário deve ser maior que zero');
      return;
    }

    setIsSaving(true);
    
    try {
      if (isEditMode && id) {
        await updateDiaperType(id, {
          name: formData.name,
          size: formData.size,
          brand: formData.brand,
          unitCost: unitCost,
          isActive: formData.isActive
        });
      } else {
        await addDiaperType({
          name: formData.name,
          size: formData.size,
          brand: formData.brand,
          unitCost: unitCost,
          isActive: formData.isActive
        });
      }

      // Navigate back to diaper usage list
      navigate('/diaper-usage');
    } catch (error) {
      console.error('Error saving diaper type:', error);
      setError('Erro ao salvar tipo de fralda. Tente novamente.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Editar Tipo de Fralda' : 'Novo Tipo de Fralda'}
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
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Informações do Tipo de Fralda
            </h3>
            <div className="space-y-6 max-w-4xl">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Fralda Geriátrica"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Tamanho */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="Ex: G, XG, M"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Marca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="Ex: BigFral, Tena, MedFral"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Custo Unitário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custo Unitário *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="unitCost"
                    value={formData.unitCost}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Ativo */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Ativo
                  </label>
                  <p className="text-xs text-gray-500">
                    Desmarque para desativar este tipo de fralda
                  </p>
                </div>
                {formData.isActive ? (
                  <ToggleRight className="w-6 h-6 text-green-500" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
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
                  <span>{isEditMode ? 'Salvar Alterações' : 'Adicionar Tipo'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
