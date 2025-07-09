import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  DollarSign, 
  Save, 
  ArrowLeft, 
  Calendar, 
  Building, 
  MessageSquare, 
  CreditCard,
  Tag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';
import { useFinancial } from '../contexts/FinancialContext';
import { useAuth } from '../contexts/AuthContext';

interface TransactionFormData {
  type: 'income' | 'expense';
  description: string;
  amount: string;
  dueDate: string;
  category: string;
  supplier: string; // Also used for client name in income transactions
  paymentMethod: string;
  observations: string;
  isRecurring: boolean;
  recurringFrequency: 'monthly' | 'quarterly' | 'yearly' | '';
}

const initialFormData: TransactionFormData = {
  type: 'expense',
  description: '',
  amount: '',
  dueDate: new Date().toISOString().split('T')[0],
  category: '',
  supplier: '',
  paymentMethod: '',
  observations: '',
  isRecurring: false,
  recurringFrequency: ''
};

const expenseCategories = [
  { value: 'payroll', label: 'Folha de Pagamento' },
  { value: 'medications', label: 'Medicamentos' },
  { value: 'food', label: 'Alimentação' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'utilities', label: 'Utilidades' },
  { value: 'taxes', label: 'Impostos' },
  { value: 'insurance', label: 'Seguros' },
  { value: 'supplies', label: 'Suprimentos' },
  { value: 'professional_services', label: 'Serviços Profissionais' },
  { value: 'others', label: 'Outros' }
];

const incomeCategories = [
  { value: 'monthly_fee', label: 'Mensalidade' },
  { value: 'health_insurance', label: 'Convênio Médico' },
  { value: 'donation', label: 'Doação' },
  { value: 'other_services', label: 'Outros Serviços' },
  { value: 'government_subsidy', label: 'Subsídio Governamental' },
  { value: 'others', label: 'Outros' }
];

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'check', label: 'Cheque' }
];

export const FinancialTransactionForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const { 
    addAccountPayable, 
    addAccountReceivable, 
    accountsPayable,
    accountsReceivable,
    updateAccountPayable,
    updateAccountReceivable,
    isLoading 
  } = useFinancial();
  
  const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Determine if we're in edit mode
  const isEditMode = location.pathname.includes('/edit/');
  const transactionId = params.id;
  const transactionType = params.type;

  // Check URL query parameters for initial type and recurring status
  useEffect(() => {
    // For new transactions
    if (!isEditMode) {
      const params = new URLSearchParams(location.search);
      const type = params.get('type');
      const recurring = params.get('recurring');
      
      if (type === 'income' || type === 'expense') {
        setFormData(prev => ({ ...prev, type }));
      }
      
      if (recurring === 'true') {
        setFormData(prev => ({ 
          ...prev, 
          isRecurring: true,
          recurringFrequency: 'monthly' 
        }));
      }
    }
    // For edit mode, load existing transaction
    else if (transactionId && transactionType) {
      if (transactionType === 'expense') {
        const expense = accountsPayable.find(exp => exp.id === transactionId);
        if (expense) {
          setFormData({
            type: 'expense',
            description: expense.description,
            amount: formatCurrency(expense.amount.toString()),
            dueDate: expense.dueDate,
            category: expense.category,
            supplier: expense.supplier,
            paymentMethod: expense.paymentMethod || '',
            observations: expense.observations || '',
            isRecurring: expense.isRecurring,
            recurringFrequency: expense.recurringFrequency || ''
          });
        } else {
          setError('Despesa não encontrada');
        }
      } else if (transactionType === 'income') {
        const income = accountsReceivable.find(inc => inc.id === transactionId);
        if (income) {
          setFormData({
            type: 'income',
            description: income.description,
            amount: formatCurrency(income.amount.toString()),
            dueDate: income.dueDate,
            category: income.source,
            supplier: income.client,
            paymentMethod: income.paymentMethod || '',
            observations: income.observations || '',
            isRecurring: false,
            recurringFrequency: ''
          });
        } else {
          setError('Receita não encontrada');
        }
      }
    }
  }, [location.search, isEditMode, transactionId, transactionType, accountsPayable, accountsReceivable]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: checked,
        // Reset recurring frequency if isRecurring is unchecked
        ...(name === 'isRecurring' && !checked ? { recurringFrequency: '' } : {})
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters
    let numericValue = value.replace(/\D/g, '');
    
    // Convert to number and divide by 100 to get the decimal value
    const floatValue = parseInt(numericValue || '0') / 100;
    
    // Format as Brazilian currency
    return floatValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrency(e.target.value.replace(/\D/g, ''));
    setFormData(prev => ({ ...prev, amount: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!formData.description.trim()) {
      setError('Descrição é obrigatória');
      return;
    }

    if (!formData.amount.trim() || formData.amount === 'R$ 0,00') {
      setError('Valor inválido');
      return;
    }

    if (!formData.dueDate) {
      setError('Data de vencimento é obrigatória');
      return;
    }

    if (!formData.category) {
      setError('Categoria é obrigatória');
      return;
    }

    if (!formData.supplier.trim()) {
      setError(formData.type === 'expense' ? 'Fornecedor é obrigatório' : 'Cliente é obrigatório');
      return;
    }

    if (formData.isRecurring && !formData.recurringFrequency) {
      setError('Frequência de recorrência é obrigatória para despesas fixas');
      return;
    }

    setIsSaving(true);
    
    try {
      // Convert formatted currency to number
      const numericValue = formData.amount.replace(/\D/g, '');
      const amount = parseInt(numericValue) / 100;
      
      if (formData.type === 'expense') {
        if (isEditMode && transactionId) {
          await updateAccountPayable(transactionId, {
            description: formData.description,
            category: formData.category as any,
            supplier: formData.supplier,
            amount,
            dueDate: formData.dueDate,
            paymentMethod: formData.paymentMethod as any || undefined,
            status: 'pending',
            observations: formData.observations || undefined,
            isRecurring: formData.isRecurring,
            recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined
          });
          setSuccess('Despesa atualizada com sucesso!');
        } else {
          await addAccountPayable({
            description: formData.description,
            category: formData.category as any,
            supplier: formData.supplier,
            amount,
            dueDate: formData.dueDate,
            paymentMethod: formData.paymentMethod as any || undefined,
            status: 'pending',
            observations: formData.observations || undefined,
            attachments: [],
            isRecurring: formData.isRecurring,
            recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined
          });
          setSuccess('Despesa adicionada com sucesso!');
        }
      } else {
        if (isEditMode && transactionId) {
          await updateAccountReceivable(transactionId, {
            description: formData.description,
            source: formData.category as any,
            client: formData.supplier,
            amount,
            dueDate: formData.dueDate,
            paymentMethod: formData.paymentMethod as any || undefined,
            status: 'pending',
            observations: formData.observations || undefined
          });
          setSuccess('Receita atualizada com sucesso!');
        } else {
          await addAccountReceivable({
            description: formData.description,
            source: formData.category as any,
            client: formData.supplier,
            amount,
            dueDate: formData.dueDate,
            paymentMethod: formData.paymentMethod as any || undefined,
            status: 'pending',
            observations: formData.observations || undefined
          });
          setSuccess('Receita adicionada com sucesso!');
        }
      }
      
      // Reset form after successful submission if not editing
      if (!isEditMode) {
        setFormData({
          ...initialFormData,
          type: formData.type // Keep the current transaction type
        });
      }
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/financial');
      }, 1500);
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError(`Erro ao ${isEditMode ? 'atualizar' : 'salvar'} ${formData.type === 'expense' ? 'despesa' : 'receita'}. Tente novamente.`);
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
          {isEditMode 
            ? `Editar ${formData.type === 'expense' ? 'Despesa' : 'Receita'}`
            : formData.isRecurring 
              ? 'Nova Despesa Fixa' 
              : `Nova ${formData.type === 'expense' ? 'Despesa' : 'Receita'}`
          }
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
          {/* Transaction Type */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
              Tipo de Transação
            </h3>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-gray-700">Despesa</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-gray-700">Receita</span>
              </label>
            </div>
          </div>

          {/* Recurring Option (only for expenses) */}
          {formData.type === 'expense' && (
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isRecurring"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                  Despesa Fixa (Recorrente)
                </label>
                <p className="text-xs text-gray-500">
                  Marque esta opção para despesas que se repetem regularmente
                </p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-green-600" />
              Informações Básicas
            </h3>
            <div className="space-y-6 max-w-4xl">
              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Compra de medicamentos"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    required
                    placeholder="R$ 0,00"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Data de Vencimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de {formData.type === 'expense' ? 'Vencimento' : 'Recebimento'} *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  {(formData.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Fornecedor/Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'expense' ? 'Fornecedor' : 'Cliente'} *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    required
                    placeholder={formData.type === 'expense' ? 'Nome do fornecedor' : 'Nome do cliente'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Forma de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de {formData.type === 'expense' ? 'Pagamento' : 'Recebimento'}
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma forma</option>
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Frequência de Recorrência (apenas para despesas fixas) */}
              {formData.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequência de Recorrência *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      name="recurringFrequency"
                      value={formData.recurringFrequency}
                      onChange={handleInputChange}
                      required={formData.isRecurring}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione a frequência</option>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                  
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700">
                        Despesas fixas são automaticamente recriadas conforme a frequência selecionada.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
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
                    placeholder="Observações adicionais sobre a transação..."
                  />
                </div>
              </div>
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
                  <span>
                    {isEditMode 
                      ? `Salvar ${formData.type === 'expense' ? 'Despesa' : 'Receita'}`
                      : `Salvar ${formData.isRecurring ? 'Despesa Fixa' : formData.type === 'expense' ? 'Despesa' : 'Receita'}`
                    }
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
