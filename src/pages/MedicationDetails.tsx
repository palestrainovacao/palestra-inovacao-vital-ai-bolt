import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pill, Edit, Clock, User, Calendar, Trash2, AlertTriangle, ArrowLeft, FileText, MessageSquare } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MedicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { residents, medications, deleteMedication } = useApp();
  const [medication, setMedication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      const foundMedication = medications.find(m => m.id === id);
      if (foundMedication) {
        setMedication(foundMedication);
      } else {
        setError('Medicação não encontrada');
      }
    } else {
      setError('ID da medicação não fornecido');
    }
    setLoading(false);
  }, [id, medications]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteMedication(id);
      navigate('/medications');
    } catch (error) {
      console.error('Error deleting medication:', error);
      setError('Erro ao excluir medicação. Tente novamente.');
    }
  };

  const getResidentName = (residentId: string) => {
    const resident = residents.find(r => r.id === residentId);
    return resident ? resident.name : 'Residente não encontrado';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'paused': return 'Pausado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  // Calculate frequency based on time slots
  const calculateFrequency = (timeSlots: string[]) => {
    const count = timeSlots.length;
    if (count === 1) return '1x ao dia';
    if (count === 2) return '2x ao dia';
    if (count === 3) return '3x ao dia';
    if (count === 4) return '4x ao dia';
    return `${count}x ao dia`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !medication) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Erro ao carregar dados da medicação'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes da Medicação</h1>
          <p className="text-gray-600">Visualizando informações completas</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={() => navigate('/medications')}
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
            onClick={() => navigate(`/medications/edit/${id}`)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-auto" style={{ width: '80%' }}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{medication.name}</h2>
              <p className="text-sm text-gray-500">
                {getResidentName(medication.residentId)}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(medication.status)}`}>
            {getStatusText(medication.status)}
          </span>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Pill className="w-5 h-5 mr-2 text-blue-600" />
              Informações da Medicação
            </h3>
            <div className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Dosagem:</span>
                  <span className="ml-2 text-gray-900">{medication.dosage}</span>
                </div>
                
                <div>
                   <span className="text-gray-500">Residente:</span>
                   <span className="ml-2 text-gray-900">{getResidentName(medication.residentId)}</span>
                </div>
                
                <div>
                   <span className="text-gray-500">Prescrito por:</span>
                   <span className="ml-2 text-gray-900">Dr(a). {medication.prescribedBy}</span>
                </div>

                <div>
                  <span className="text-gray-500">Frequência:</span>
                  <span className="ml-2 text-gray-900">
                    {medication.frequency || calculateFrequency(medication.time)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Horários */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-600" />
              Horários de Administração
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {medication.time.map((time: string) => (
                  <span
                    key={time}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {time}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Período de Tratamento */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-600" />
              Período de Tratamento
            </h3>
            <div className="space-y-4 max-w-4xl">
              <div>
                <span className="text-gray-500">Data de início:</span>
                <span className="ml-2 text-gray-900">
                  {format(parseISO(medication.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
              
              {medication.endDate && (
                <div>
                  <span className="text-gray-500">Data de fim:</span>
                  <span className="ml-2 text-gray-900">
                    {format(parseISO(medication.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              )}
              
              {!medication.endDate && medication.status === 'active' && (
                <div className="text-sm text-blue-600">
                  Tratamento em andamento sem data de término definida
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {medication.observations && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                Observações e Instruções Especiais
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{medication.observations}</p>
              </div>
            </div>
          )}

          {/* Receita Médica */}
          {medication.medicalPrescriptionUrl && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                Receita Médica
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">Receita médica anexada</span>
                <a 
                  href={medication.medicalPrescriptionUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Visualizar
                </a>
              </div>
            </div>
          )}

          {/* Status e Informações Adicionais */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-purple-600" />
              Status e Informações Adicionais
            </h3>
            <div className="space-y-4 max-w-4xl">
              <div>
                <span className="text-gray-500">Status atual:</span>
                <span className={`ml-2 px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(medication.status)}`}>
                  {getStatusText(medication.status)}
                </span>
              </div>
              
              <div>
                <span className="text-gray-500">Última atualização:</span>
                <span className="ml-2 text-gray-900">
                  {medication.updatedAt ? format(parseISO(medication.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                </span>
              </div>
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
                Tem certeza que deseja excluir esta medicação? Esta ação não pode ser desfeita.
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
