import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  TestTube, 
  Calendar,
  ArrowLeft,
  ArrowRight,
  Receipt,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Download,
  AlertTriangle,
  Clock,
  X,
  CheckCircle,
  Info,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  Check,
  Save
} from 'lucide-react';
import { useFinancial } from '../contexts/FinancialContext';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { createTestFinancialData } from '../utils/financialTestData';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Financial: React.FC = () => {
  const { 
    monthlyFees, 
    accountsPayable, 
    accountsReceivable, 
    updateMonthlyFee,
    updateAccountPayable,
    updateAccountReceivable,
    isLoading,
    refreshData
  } = useFinancial();
  const { residents } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [creatingTestData, setCreatingTestData] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [editingAmount, setEditingAmount] = useState<{id: string, type: string, value: string} | null>(null);
  const [editingStatus, setEditingStatus] = useState<{id: string, type: string} | null>(null);

  // Calculate month range for filtering
  const startDate = startOfMonth(new Date(`${selectedMonth}-01`)).toISOString();
  const endDate = endOfMonth(new Date(`${selectedMonth}-01`)).toISOString();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const isCurrentMonth = selectedMonth === currentMonth;

  // Navigate between months
  const goToPreviousMonth = () => {
    const date = new Date(`${selectedMonth}-01`);
    const prevMonth = subMonths(date, 1);
    setSelectedMonth(prevMonth.toISOString().slice(0, 7));
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return; // Don't allow navigating to future months
    const date = new Date(`${selectedMonth}-01`);
    const nextMonth = addMonths(date, 1);
    setSelectedMonth(nextMonth.toISOString().slice(0, 7));
  };

  // Filter transactions for the selected month
  const filteredMonthlyFees = monthlyFees.filter(fee => {
    const feeMonth = fee.month;
    const matchesMonth = feeMonth === selectedMonth;
    const matchesSearch = fee.observations?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         residents.find(r => r.id === fee.residentId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || filterType === 'income';
    const matchesStatus = filterStatus === 'all' || fee.status === filterStatus;
    
    return matchesMonth && (searchTerm === '' || matchesSearch) && matchesType && matchesStatus;
  });

  const filteredAccountsPayable = accountsPayable.filter(expense => {
    const expenseDate = new Date(expense.dueDate);
    const matchesMonth = expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         expense.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || filterType === 'expense';
    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
    
    return matchesMonth && (searchTerm === '' || matchesSearch) && matchesType && matchesStatus;
  });

  const filteredAccountsReceivable = accountsReceivable.filter(income => {
    const incomeDate = new Date(income.dueDate);
    const matchesMonth = incomeDate >= new Date(startDate) && incomeDate <= new Date(endDate);
    const matchesSearch = income.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         income.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || filterType === 'income';
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'paid' && income.status === 'received') || 
                         (filterStatus === 'pending' && income.status === 'pending') || 
                         (filterStatus === 'overdue' && income.status === 'overdue');
    
    return matchesMonth && (searchTerm === '' || matchesSearch) && matchesType && matchesStatus;
  });

  // Calculate monthly totals
  const monthlyIncome = filteredMonthlyFees.reduce((sum, fee) => {
    if (fee.status === 'paid') {
      return sum + fee.amount;
    }
    return sum;
  }, 0) + filteredAccountsReceivable.reduce((sum, income) => {
    if (income.status === 'received') {
      return sum + income.amount;
    }
    return sum;
  }, 0);

  const monthlyExpenses = filteredAccountsPayable.reduce((sum, expense) => {
    if (expense.status === 'paid') {
      return sum + expense.amount;
    }
    return sum;
  }, 0);

  const monthlyBalance = monthlyIncome - monthlyExpenses;

  const pendingIncome = filteredMonthlyFees.reduce((sum, fee) => {
    if (fee.status === 'pending') {
      return sum + fee.amount;
    }
    return sum;
  }, 0) + filteredAccountsReceivable.reduce((sum, income) => {
    if (income.status === 'pending') {
      return sum + income.amount;
    }
    return sum;
  }, 0);

  const pendingExpenses = filteredAccountsPayable.reduce((sum, expense) => {
    if (expense.status === 'pending') {
      return sum + expense.amount;
    }
    return sum;
  }, 0);

  // Calculate projected cash flow
  const projectedCashFlow = monthlyBalance + (pendingIncome - pendingExpenses);

  // Combine all transactions for display
  const allTransactions = [
    ...filteredMonthlyFees.map(fee => ({
      id: fee.id,
      type: 'income',
      description: `Mensalidade - ${residents.find(r => r.id === fee.residentId)?.name || 'Residente'}`,
      amount: fee.amount,
      dueDate: fee.dueDate,
      paidDate: fee.paidDate,
      status: fee.status,
      category: 'monthly_fee',
      entity: residents.find(r => r.id === fee.residentId)?.name || 'Residente',
      isRecurring: true,
      source: 'monthly_fee',
      originalData: fee
    })),
    ...filteredAccountsPayable.map(expense => ({
      id: expense.id,
      type: 'expense',
      description: expense.description,
      amount: expense.amount,
      dueDate: expense.dueDate,
      paidDate: expense.paidDate,
      status: expense.status,
      category: expense.category,
      entity: expense.supplier,
      isRecurring: expense.isRecurring,
      source: 'account_payable',
      originalData: expense
    })),
    ...filteredAccountsReceivable.map(income => ({
      id: income.id,
      type: 'income',
      description: income.description,
      amount: income.amount,
      dueDate: income.dueDate,
      paidDate: income.receivedDate,
      status: income.status === 'received' ? 'paid' : income.status,
      category: income.source,
      entity: income.client,
      isRecurring: false,
      source: 'account_receivable',
      originalData: income
    }))
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleCreateTestData = async () => {
    if (!user) {
      alert('Usuário não encontrado. Faça login novamente.');
      return;
    }
    
    if (residents.length === 0) {
      alert('Nenhum residente encontrado. Crie residentes primeiro.');
      return;
    }
    
    setCreatingTestData(true);
    try {
      console.log('Creating test financial data for user:', user.id);
      
      const result = await createTestFinancialData(user.id, residents, user.organizationId);
      
      console.log('Test financial data created, refreshing app data...');
      await refreshData();
      
      alert(`Dados financeiros de teste criados com sucesso!\n\n✅ ${result.monthlyFees.length} mensalidades\n✅ ${result.accountsPayable.length} contas a pagar\n✅ ${result.accountsReceivable.length} contas a receber`);
    } catch (error) {
      console.error('Error creating test financial data:', error);
      alert(`Erro ao criar dados de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setCreatingTestData(false);
    }
  };

  const handleUpdateTransactionStatus = async (transaction: any, newStatus: string) => {
    try {
      if (transaction.source === 'monthly_fee') {
        await updateMonthlyFee(transaction.id, {
          status: newStatus,
          paidDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined
        });
      } else if (transaction.source === 'account_payable') {
        await updateAccountPayable(transaction.id, {
          status: newStatus,
          paidDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined
        });
      } else if (transaction.source === 'account_receivable') {
        await updateAccountReceivable(transaction.id, {
          status: newStatus === 'paid' ? 'received' : newStatus,
          receivedDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined
        });
      }
      
      await refreshData();
      setEditingStatus(null);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      alert('Erro ao atualizar status da transação. Tente novamente.');
    }
  };

  const handleUpdateTransactionAmount = async (transaction: any, newAmount: string) => {
    try {
      // Convert formatted amount to number
      const numericValue = newAmount.replace(/\D/g, '');
      const amount = parseInt(numericValue) / 100;
      
      if (isNaN(amount) || amount <= 0) {
        alert('Valor inválido. Por favor, insira um valor maior que zero.');
        return;
      }
      
      if (transaction.source === 'monthly_fee') {
        await updateMonthlyFee(transaction.id, { amount });
      } else if (transaction.source === 'account_payable') {
        await updateAccountPayable(transaction.id, { amount });
      } else if (transaction.source === 'account_receivable') {
        await updateAccountReceivable(transaction.id, { amount });
      }
      
      await refreshData();
      setEditingAmount(null);
    } catch (error) {
      console.error('Error updating transaction amount:', error);
      alert('Erro ao atualizar valor da transação. Tente novamente.');
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, transaction: any) => {
    const formattedValue = formatCurrency(e.target.value.replace(/\D/g, ''));
    setEditingAmount({
      id: transaction.id,
      type: transaction.source,
      value: formattedValue
    });
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, transaction: any) => {
    if (e.key === 'Enter' && editingAmount) {
      handleUpdateTransactionAmount(transaction, editingAmount.value);
    } else if (e.key === 'Escape') {
      setEditingAmount(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
      case 'received':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Atrasado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getCategoryText = (category: string, type: string) => {
    if (type === 'expense') {
      const expenseCat = expenseCategories.find(c => c.value === category);
      return expenseCat ? expenseCat.label : category;
    } else {
      const incomeCat = incomeCategories.find(c => c.value === category);
      return incomeCat ? incomeCat.label : category;
    }
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Carregando dados financeiros...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Controle financeiro e fluxo de caixa</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {monthlyFees.length === 0 && accountsPayable.length === 0 && accountsReceivable.length === 0 && (
            <button 
              onClick={handleCreateTestData}
              disabled={creatingTestData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingTestData ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              <span>{creatingTestData ? 'Criando Dados...' : 'Criar Dados de Teste'}</span>
            </button>
          )}
          <button 
            onClick={() => navigate('/financial/transactions/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Transação</span>
          </button>
          <button 
            onClick={() => navigate('/financial/monthly-fees/generate')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Gerar Mensalidades</span>
          </button>
        </div>
      </div>

      {/* Month Selector and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Month Navigation */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={goToPreviousMonth}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-800 font-medium">
                {format(new Date(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR })}
              </div>
            </div>
            
            <button 
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className={`p-2 rounded-full ${isCurrentMonth ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendentes</option>
              <option value="paid">Pagos</option>
              <option value="overdue">Atrasados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">Receitas</h3>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            R$ {monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Pendente: R$ {pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">Despesas</h3>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            R$ {monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Pendente: R$ {pendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">Saldo</h3>
            <DollarSign className={`w-4 h-4 ${monthlyBalance >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
          </div>
          <p className={`text-xl font-bold ${monthlyBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            R$ {monthlyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {monthlyBalance >= 0 ? 'Saldo positivo' : 'Saldo negativo'} no mês
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">Fluxo Projetado</h3>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <p className={`text-xl font-bold ${projectedCashFlow >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            R$ {projectedCashFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Baseado em contas pendentes
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transações do Mês</h3>
          <p className="text-sm text-gray-500">
            {format(new Date(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        
        {allTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fornecedor/Cliente
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allTransactions.map((transaction) => (
                  <tr key={`${transaction.source}-${transaction.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(transaction.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                      {transaction.paidDate && (
                        <div className="text-xs text-gray-500">
                          Pago em: {format(new Date(transaction.paidDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {getCategoryText(transaction.category, transaction.type)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {transaction.entity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingAmount && editingAmount.id === transaction.id && editingAmount.type === transaction.source ? (
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={editingAmount.value}
                            onChange={(e) => handleAmountChange(e, transaction)}
                            onBlur={() => handleUpdateTransactionAmount(transaction, editingAmount.value)}
                            onKeyDown={(e) => handleAmountKeyDown(e, transaction)}
                            autoFocus
                            className="w-32 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button 
                            onClick={() => handleUpdateTransactionAmount(transaction, editingAmount.value)}
                            className="ml-1 p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span 
                          className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'} cursor-pointer hover:underline`}
                          onClick={() => setEditingAmount({
                            id: transaction.id,
                            type: transaction.source,
                            value: formatCurrency(transaction.amount.toString())
                          })}
                        >
                          {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingStatus && editingStatus.id === transaction.id && editingStatus.type === transaction.source ? (
                        <select
                          value={transaction.status}
                          onChange={(e) => handleUpdateTransactionStatus(transaction, e.target.value)}
                          onBlur={() => setEditingStatus(null)}
                          autoFocus
                          className="px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pendente</option>
                          <option value="paid">Pago</option>
                          <option value="overdue">Atrasado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      ) : (
                        <span 
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(transaction.status)} cursor-pointer`}
                          onClick={() => setEditingStatus({
                            id: transaction.id,
                            type: transaction.source
                          })}
                        >
                          {getStatusText(transaction.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {transaction.isRecurring && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                            <Clock className="w-3 h-3 mr-1" />
                            Fixa
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {transaction.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateTransactionStatus(transaction, 'paid')}
                            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Marcar como pago"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/financial/transactions/edit/${transaction.type}/${transaction.id}`)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (transaction.source === 'monthly_fee') {
                              navigate(`/financial/monthly-fees/view/${transaction.id}`);
                            } else {
                              navigate(`/financial/transactions/view/${transaction.type}/${transaction.id}`);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                ? 'Nenhuma transação encontrada' 
                : `Não há transações registradas para ${format(new Date(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR })}.`
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece adicionando transações para este mês.'
              }
            </p>
            {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
              <div className="flex items-center justify-center space-x-4">
                <button 
                  onClick={() => navigate('/financial/transactions/new')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Transação</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {monthlyFees.length === 0 && accountsPayable.length === 0 && accountsReceivable.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum dado financeiro encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              Comece criando dados de teste ou adicione suas primeiras transações financeiras.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button 
                onClick={handleCreateTestData}
                disabled={creatingTestData}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingTestData ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                <span>{creatingTestData ? 'Criando Dados...' : 'Criar Dados de Teste'}</span>
              </button>
              <button 
                onClick={() => navigate('/financial/transactions/new')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Transação</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
