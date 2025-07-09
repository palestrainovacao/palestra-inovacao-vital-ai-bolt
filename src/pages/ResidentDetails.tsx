import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Edit, Stethoscope, Activity, MapPin, Calendar, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ResidentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { residents, deleteResident } = useApp();
  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      const foundResident = residents.find(r => r.id === id);
      if (foundResident) {
        setResident(foundResident);
      } else {
        setError('Residente não encontrado');
      }
    } else {
      setError('ID do residente não fornecido');
    }
    setLoading(false);
  }, [id, residents]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteResident(id);
      navigate('/residents');
    } catch (error) {
      console.error('Error deleting resident:', error);
      setError('Erro ao excluir residente. Tente novamente.');
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'bg-green-100 text-green-800';
      case 'attention': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case 'stable': return 'Estável';
      case 'attention': return 'Atenção';
      case 'critical': return 'Crítico';
      default: return status;
    }
  };

  const getMobilityStatusText = (status?: string) => {
    switch (status) {
      case 'walking': return 'Deambulando';
      case 'crutches': return 'Muletas';
      case 'stretcher': return 'Maca';
      case 'wheelchair': return 'Cadeira de Rodas';
      default: return 'Não informado';
    }
  };

  const getConsciousnessLevelText = (level?: string) => {
    switch (level) {
      case 'lucid': return 'Lúcido/Orientado';
      case 'sleepy': return 'Sonolento';
      case 'torporous': return 'Torporoso';
      case 'confused': return 'Confuso';
      default: return 'Não informado';
    }
  };

  const getDependencyLevelText = (level?: string) => {
    switch (level) {
      case 'independent': return 'Independente';
      case 'semi_dependent': return 'Semi-dependente';
      case 'dependent': return 'Totalmente dependente';
      default: return 'Não informado';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Erro ao carregar dados do residente'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes do Residente</h1>
          <p className="text-gray-600">Visualizando informações completas</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={() => navigate('/residents')}
            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>
          <button 
            onClick={() => navigate(`/residents/edit/${id}`)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{resident.name}</h2>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getHealthStatusColor(resident.healthStatus)}`}>
            {getHealthStatusText(resident.healthStatus)}
          </span>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Informações Básicas
            </h3>
            <div className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Idade:</span>
                  <span className="ml-2 text-gray-900">{resident.age} anos</span>
                </div>
                
                <div>
                  <span className="text-gray-500">Gênero:</span>
                  <span className="ml-2 text-gray-900">{resident.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
                </div>
                
                <div>
                  <span className="text-gray-500">Data de Admissão:</span>
                  <span className="ml-2 text-gray-900">
                    {format(parseISO(resident.admissionDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Quarto:</span>
                  <span className="ml-2 text-gray-900">{resident.room}</span>
                </div>

                <div className="md:col-span-2">
                  <span className="text-gray-500">Mensalidade:</span>
                  <span className="ml-2 text-gray-900 font-semibold">
                    R$ {resident.monthlyFeeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações de Saúde */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2 text-red-600" />
              Informações de Saúde
            </h3>
            <div className="space-y-4 max-w-4xl">
              <div>
                <span className="text-gray-500">Estado de Locomoção:</span>
                <span className="ml-2 text-gray-900">{getMobilityStatusText(resident.mobilityStatus)}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Nível de Consciência:</span>
                <span className="ml-2 text-gray-900">{getConsciousnessLevelText(resident.consciousnessLevel)}</span>
              </div>
              
              {resident.medicalDiagnosis && resident.medicalDiagnosis.length > 0 && (
                <div>
                  <span className="text-gray-500">Diagnóstico Médico:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {resident.medicalDiagnosis.map((diagnosis: string, index: number) => (
                      <span key={index} className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                        {diagnosis}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-gray-500">Dificuldade na Deglutição:</span>
                <span className="ml-2 text-gray-900">{resident.swallowingDifficulty ? 'Sim' : 'Não'}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Atividade Física:</span>
                <span className="ml-2 text-gray-900">{resident.physicalActivity ? 'Sim' : 'Não'}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Úlcera por Pressão:</span>
                <span className="ml-2 text-gray-900">{resident.pressureUlcer ? 'Sim' : 'Não'}</span>
              </div>
              
              {resident.pressureUlcer && resident.pressureUlcerLocation && (
                <div>
                  <span className="text-gray-500">Local da Úlcera:</span>
                  <span className="ml-2 text-gray-900">{resident.pressureUlcerLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grau de Dependência */}
          {resident.dependencyLevels && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                Grau de Dependência para Atividades Diárias
              </h3>
              <div className="space-y-4 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Comer/Beber:</span>
                    <span className="ml-2 text-gray-900">
                      {getDependencyLevelText(resident.dependencyLevels?.eating)}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Banho:</span>
                    <span className="ml-2 text-gray-900">
                      {getDependencyLevelText(resident.dependencyLevels?.bathing)}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Vestir-se:</span>
                    <span className="ml-2 text-gray-900">
                      {getDependencyLevelText(resident.dependencyLevels?.dressing)}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Subir Escadas:</span>
                    <span className="ml-2 text-gray-900">
                      {getDependencyLevelText(resident.dependencyLevels?.stairs)}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Deambular:</span>
                    <span className="ml-2 text-gray-900">
                      {getDependencyLevelText(resident.dependencyLevels?.walking)}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Mobilidade na Cama:</span>
                    <span className="ml-2 text-gray-900">
                      {getDependencyLevelText(resident.dependencyLevels?.bedMobility)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contato de Emergência */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-orange-600" />
              Contato de Emergência
            </h3>
            <div className="space-y-4 max-w-4xl">
              <div>
                <span className="text-gray-500">Nome:</span>
                <span className="ml-2 text-gray-900">{resident.emergencyContact.name}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Telefone:</span>
                <span className="ml-2 text-gray-900">{resident.emergencyContact.phone}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Parentesco:</span>
                <span className="ml-2 text-gray-900">{resident.emergencyContact.relation}</span>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-gray-600" />
              Observações
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">{resident.notes || "Sem observações adicionais."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir este residente? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
