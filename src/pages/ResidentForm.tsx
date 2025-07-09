import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Save, Calendar, MapPin, Stethoscope, Activity, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Resident } from '../types';
import { calculateAge } from '../utils/dateUtils';
import { TagInput } from '../components/TagInput';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { SegmentedControl } from '../components/SegmentedControl';

interface ResidentFormData {
  name: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  admissionDate: string;
  room: string;
  healthStatus: 'stable' | 'attention' | 'critical';
  notes: string;
  mobilityStatus: 'walking' | 'crutches' | 'stretcher' | 'wheelchair';
  medicalDiagnosis: string[];
  swallowingDifficulty: boolean;
  physicalActivity: boolean;
  consciousnessLevel: 'lucid' | 'sleepy' | 'torporous' | 'confused';
  pressureUlcer: boolean;
  pressureUlcerLocation: string;
  dependencyLevels: {
    eating: 'independent' | 'semi_dependent' | 'dependent';
    bathing: 'independent' | 'semi_dependent' | 'dependent';
    dressing: 'independent' | 'semi_dependent' | 'dependent';
    stairs: 'independent' | 'semi_dependent' | 'dependent';
    walking: 'independent' | 'semi_dependent' | 'dependent';
    bedMobility: 'independent' | 'semi_dependent' | 'dependent';
  };
}

const initialFormData: ResidentFormData = {
  name: '',
  dateOfBirth: '',
  gender: 'M',
  admissionDate: new Date().toISOString().split('T')[0],
  room: '',
  healthStatus: 'stable',
  notes: '',
  mobilityStatus: 'walking',
  medicalDiagnosis: [],
  swallowingDifficulty: false,
  physicalActivity: false,
  consciousnessLevel: 'lucid',
  pressureUlcer: false,
  pressureUlcerLocation: '',
  dependencyLevels: {
    eating: 'independent',
    bathing: 'independent',
    dressing: 'independent',
    stairs: 'independent',
    walking: 'independent',
    bedMobility: 'independent'
  }
};

// Lista de diagnósticos médicos comuns para sugestões
const commonDiagnoses = [
  'Hipertensão Arterial',
  'Diabetes Mellitus',
  'Alzheimer',
  'Parkinson',
  'Demência',
  'AVC',
  'Insuficiência Cardíaca',
  'DPOC',
  'Artrite',
  'Osteoporose',
  'Depressão',
  'Ansiedade',
  'Hipotireoidismo',
  'Câncer',
  'Insuficiência Renal',
  'Epilepsia',
  'Glaucoma',
  'Catarata',
  'Doença de Chagas',
  'Fibrilação Atrial'
];

// Opções para o controle segmentado de dependência
const dependencyOptions = [
  { value: 'independent', label: 'Independente' },
  { value: 'semi_dependent', label: 'Semi-dependente' },
  { value: 'dependent', label: 'Totalmente dependente' }
];

export const ResidentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { residents, addResident, updateResident, isLoading } = useApp();
  const { user } = useAuth();
  const [formData, setFormData] = useState<ResidentFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!id;

  // Load resident data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const resident = residents.find(r => r.id === id);
      if (resident) {
        // Aqui precisamos converter a idade de volta para data de nascimento
        // Como não temos a data de nascimento armazenada, vamos estimar
        const today = new Date();
        const estimatedBirthYear = today.getFullYear() - resident.age;
        const estimatedDateOfBirth = `${estimatedBirthYear}-01-01`;

        setFormData({
          name: resident.name,
          dateOfBirth: estimatedDateOfBirth,
          gender: resident.gender,
          admissionDate: resident.admissionDate,
          room: resident.room,
          healthStatus: resident.healthStatus,
          notes: resident.notes,
          // Valores padrão para os novos campos, já que não existem no banco ainda
          mobilityStatus: 'walking',
          medicalDiagnosis: [],
          swallowingDifficulty: false,
          physicalActivity: false,
          consciousnessLevel: 'lucid',
          pressureUlcer: false,
          pressureUlcerLocation: '',
          dependencyLevels: {
            eating: 'independent',
            bathing: 'independent',
            dressing: 'independent',
            stairs: 'independent',
            walking: 'independent',
            bedMobility: 'independent'
          }
        });
      } else {
        setError('Residente não encontrado');
      }
    }
  }, [id, residents, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('dependencyLevels.')) {
      // Lidar com campos aninhados para níveis de dependência
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dependencyLevels: {
          ...prev.dependencyLevels,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDependencyChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dependencyLevels: {
        ...prev.dependencyLevels,
        [field]: value
      }
    }));
  };

  const handleDiagnosisChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, medicalDiagnosis: tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    
    try {
      // Validar data de nascimento
      if (!formData.dateOfBirth) {
        setError('Por favor, informe a data de nascimento.');
        setIsSaving(false);
        return;
      }

      // Calcular idade a partir da data de nascimento
      const age = calculateAge(formData.dateOfBirth);
      
      // Preparar dados para salvar
      // Por enquanto, vamos manter apenas os campos que já existem no banco
      // Os novos campos serão adicionados quando a migração do banco for feita
      const residentData: Omit<Resident, 'id'> = {
        name: formData.name,
        age: age,
        gender: formData.gender,
        admissionDate: formData.admissionDate,
        room: formData.room,
        emergencyContact: {
          name: '',
          phone: '',
          relation: '',
        },
        healthStatus: formData.healthStatus,
        notes: formData.notes,
        monthlyFeeAmount: 3000, // Valor padrão
        medications: []
      };

      if (isEditMode && id) {
        await updateResident(id, residentData);
      } else {
        await addResident(residentData);
      }

      // Navigate back to residents list
      navigate('/residents');
    } catch (error) {
      console.error('Error saving resident:', error);
      setError('Erro ao salvar residente. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Editar Residente' : 'Novo Residente'}
        </h1>
        <button
          onClick={() => navigate('/residents')}
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
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Informações Básicas
            </h3>
            <div className="space-y-6 max-w-4xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {formData.dateOfBirth && (
                  <p className="text-sm text-gray-500 mt-1">
                    Idade: {calculateAge(formData.dateOfBirth)} anos
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gênero *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Admissão *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="admissionDate"
                    value={formData.admissionDate}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quarto *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: 101, A-15"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status de Saúde *
                </label>
                <select
                  name="healthStatus"
                  value={formData.healthStatus}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="stable">Estável</option>
                  <option value="attention">Atenção</option>
                  <option value="critical">Crítico</option>
                </select>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2 text-red-600" />
              Informações de Saúde
            </h3>
            <div className="space-y-6 max-w-4xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de Locomoção *
                </label>
                <select
                  name="mobilityStatus"
                  value={formData.mobilityStatus}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="walking">Deambulando</option>
                  <option value="crutches">Muletas</option>
                  <option value="stretcher">Maca</option>
                  <option value="wheelchair">Cadeira de Rodas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Consciência *
                </label>
                <select
                  name="consciousnessLevel"
                  value={formData.consciousnessLevel}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="lucid">Lúcido/Orientado</option>
                  <option value="sleepy">Sonolento</option>
                  <option value="torporous">Torporoso</option>
                  <option value="confused">Confuso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico Médico
                </label>
                <TagInput 
                  tags={formData.medicalDiagnosis}
                  suggestions={commonDiagnoses}
                  onChange={handleDiagnosisChange}
                  placeholder="Digite e pressione Enter para adicionar"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Digite as condições médicas diagnosticadas e pressione Enter para adicionar
                </p>
              </div>

              <div className="space-y-4">
                <ToggleSwitch
                  label="Dificuldade na Deglutição"
                  checked={formData.swallowingDifficulty}
                  onChange={(checked) => setFormData(prev => ({ ...prev, swallowingDifficulty: checked }))}
                />

                <ToggleSwitch
                  label="Atividade Física"
                  checked={formData.physicalActivity}
                  onChange={(checked) => setFormData(prev => ({ ...prev, physicalActivity: checked }))}
                />

                <ToggleSwitch
                  label="Úlcera por Pressão"
                  checked={formData.pressureUlcer}
                  onChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    pressureUlcer: checked,
                    pressureUlcerLocation: checked ? prev.pressureUlcerLocation : ''
                  }))}
                />
              </div>
              
              {formData.pressureUlcer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Local da Úlcera *
                  </label>
                  <input
                    type="text"
                    name="pressureUlcerLocation"
                    value={formData.pressureUlcerLocation}
                    onChange={handleInputChange}
                    required={formData.pressureUlcer}
                    placeholder="Especifique o local da úlcera por pressão"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dependency Levels */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-600" />
              Grau de Dependência para Atividades Diárias
            </h3>
            
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comer/Beber</label>
                  <SegmentedControl
                    options={dependencyOptions}
                    value={formData.dependencyLevels.eating}
                    onChange={(value) => handleDependencyChange('eating', value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banho</label>
                  <SegmentedControl
                    options={dependencyOptions}
                    value={formData.dependencyLevels.bathing}
                    onChange={(value) => handleDependencyChange('bathing', value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vestir-se</label>
                  <SegmentedControl
                    options={dependencyOptions}
                    value={formData.dependencyLevels.dressing}
                    onChange={(value) => handleDependencyChange('dressing', value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subir Escadas</label>
                  <SegmentedControl
                    options={dependencyOptions}
                    value={formData.dependencyLevels.stairs}
                    onChange={(value) => handleDependencyChange('stairs', value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deambular</label>
                  <SegmentedControl
                    options={dependencyOptions}
                    value={formData.dependencyLevels.walking}
                    onChange={(value) => handleDependencyChange('walking', value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobilidade na Cama</label>
                  <SegmentedControl
                    options={dependencyOptions}
                    value={formData.dependencyLevels.bedMobility}
                    onChange={(value) => handleDependencyChange('bedMobility', value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações *
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={6}
              required
              placeholder="Informações adicionais sobre o residente..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/residents')}
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
                  <span>{isEditMode ? 'Salvar Alterações' : 'Adicionar Residente'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
