import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  Save, 
  ArrowLeft, 
  Calendar, 
  AlertTriangle, 
  Info,
  CheckCircle,
  Users
} from 'lucide-react';
import { useFinancial } from '../contexts/FinancialContext';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MonthlyFeeGeneration: React.FC = () => {
  const navigate = useNavigate();
  const { residents } = useApp();
  const { monthlyFees, generateMonthlyFees, isLoading } = useFinancial();
  
  const [formData, setFormData] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    year: new Date().getFullYear()
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [feesAlreadyExist, setFeesAlreadyExist] = useState(false);

  // Check if monthly fees already exist for the selected period
  useEffect(() => {
    const checkExistingFees = () => {
      const selectedMonth = formData.month;
      const existingFeesForPeriod = monthlyFees.filter(fee => fee.month === selectedMonth);
      setFeesAlreadyExist(existingFeesForPeriod.length > 0);
    };

    checkExistingFees();
  }, [formData.month, monthlyFees]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'month') {
      const [year, month] = value.split('-');
      setFormData({
        month: value,
        year: parseInt(year)
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (feesAlreadyExist) {
      setError('Mensalidades já existem para este período. Selecione outro mês.');
      return;
    }

    if (residents.length === 0) {
      setError('Nenhum residente encontrado. Adicione residentes antes de gerar mensalidades.');
      return;
    }

    setIsSaving(true);
    
    try {
      await generateMonthlyFees(formData.month, formData.year);
      
      setSuccess(`Mensalidades geradas com sucesso para ${format(new Date(formData.month + '-01'), 'MMMM/yyyy', { locale: ptBR })}!`);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/financial');
      }, 2000);
    } catch (error) {
      console.error('Error generating monthly fees:', error);
      setError(`Erro ao gerar mensalidades: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
          Gerar Mensalidades
        </h1>
        <button
          onClick={() => navigate('/financial')}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
          <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-blue-600" />
              Informações de Geração
            </h3>
            <div className="space-y-6 max-w-4xl">
              {/* Mês/Ano */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês/Ano para Geração *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="month"
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Selecione o mês e ano para o qual deseja gerar as mensalidades
                </p>
              </div>
              
              {/* Residents Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Residentes com mensalidades a gerar: {residents.length}
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc pl-5">
                      <li>Cada residente terá sua própria mensalidade com o valor configurado em seu cadastro</li>
                      <li>A data de vencimento será definida como dia 5 do mês selecionado</li>
                      <li>O status inicial será "Pendente"</li>
                      <li>Valor total aproximado: R$ {residents.reduce((sum, resident) => sum + (resident.monthlyFeeAmount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Warning if fees already exist */}
              {feesAlreadyExist && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Mensalidades já existem para este período
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Já foram encontradas mensalidades geradas para {format(new Date(formData.month + '-01'), 'MMMM/yyyy', { locale: ptBR })}. 
                        Selecione um período diferente para gerar novas mensalidades.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/financial')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || feesAlreadyExist || residents.length === 0}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Gerar Mensalidades</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
