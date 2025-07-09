import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { 
  MonthlyFee, 
  AccountPayable, 
  AccountReceivable,
  FinancialMetrics,
  DatabaseMonthlyFee,
  DatabaseAccountPayable,
  DatabaseAccountReceivable
} from '../types/financial';

interface FinancialContextType {
  monthlyFees: MonthlyFee[];
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  metrics: FinancialMetrics | null;
  addMonthlyFee: (fee: Omit<MonthlyFee, 'id'>) => Promise<void>;
  updateMonthlyFee: (id: string, fee: Partial<MonthlyFee>) => Promise<void>;
  deleteMonthlyFee: (id: string) => Promise<void>;
  addAccountPayable: (account: Omit<AccountPayable, 'id'>) => Promise<void>;
  updateAccountPayable: (id: string, account: Partial<AccountPayable>) => Promise<void>;
  deleteAccountPayable: (id: string) => Promise<void>;
  addAccountReceivable: (account: Omit<AccountReceivable, 'id'>) => Promise<void>;
  updateAccountReceivable: (id: string, account: Partial<AccountReceivable>) => Promise<void>;
  deleteAccountReceivable: (id: string) => Promise<void>;
  generateMonthlyFees: (month: string, year: number) => Promise<void>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  connectionError: string | null;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

interface FinancialProviderProps {
  children: ReactNode;
}

// Transform functions
const transformMonthlyFee = (dbFee: DatabaseMonthlyFee): MonthlyFee => ({
  id: dbFee.id,
  residentId: dbFee.resident_id,
  amount: dbFee.amount,
  dueDate: dbFee.due_date,
  paidDate: dbFee.paid_date || undefined,
  discount: dbFee.discount,
  lateFee: dbFee.late_fee,
  status: dbFee.status as MonthlyFee['status'],
  observations: dbFee.observations || undefined,
  paymentMethod: dbFee.payment_method as MonthlyFee['paymentMethod'],
  month: dbFee.month,
  year: dbFee.year,
  organizationId: dbFee.organization_id,
});

const transformAccountPayable = (dbAccount: DatabaseAccountPayable): AccountPayable => ({
  id: dbAccount.id,
  description: dbAccount.description,
  category: dbAccount.category as AccountPayable['category'],
  supplier: dbAccount.supplier,
  amount: dbAccount.amount,
  dueDate: dbAccount.due_date,
  paidDate: dbAccount.paid_date || undefined,
  paymentMethod: dbAccount.payment_method as AccountPayable['paymentMethod'],
  costCenter: dbAccount.cost_center || undefined,
  status: dbAccount.status as AccountPayable['status'],
  observations: dbAccount.observations || undefined,
  attachments: dbAccount.attachments,
  isRecurring: dbAccount.is_recurring,
  recurringFrequency: dbAccount.recurring_frequency as AccountPayable['recurringFrequency'],
  organizationId: dbAccount.organization_id,
});

const transformAccountReceivable = (dbAccount: DatabaseAccountReceivable): AccountReceivable => ({
  id: dbAccount.id,
  description: dbAccount.description,
  source: dbAccount.source as AccountReceivable['source'],
  client: dbAccount.client,
  amount: dbAccount.amount,
  dueDate: dbAccount.due_date,
  receivedDate: dbAccount.received_date || undefined,
  paymentMethod: dbAccount.payment_method as AccountReceivable['paymentMethod'],
  status: dbAccount.status as AccountReceivable['status'],
  observations: dbAccount.observations || undefined,
  organizationId: dbAccount.organization_id,
});

export const FinancialProvider: React.FC<FinancialProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [monthlyFees, setMonthlyFees] = useState<MonthlyFee[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setMonthlyFees([]);
      setAccountsPayable([]);
      setAccountsReceivable([]);
      setMetrics(null);
      setConnectionError(null);
    }
  }, [user]);

  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    
    // Check for network-related errors
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('NetworkError') ||
        error.message?.includes('fetch')) {
      setConnectionError('Erro de conexão com o servidor. Verifique sua conexão com a internet.');
    } else if (error.code === 'PGRST301') {
      setConnectionError('Erro de autenticação. Faça login novamente.');
    } else {
      setConnectionError(`Erro ao carregar dados financeiros: ${error.message}`);
    }
  };

  const refreshData = async () => {
    if (!user) return;

    setIsLoading(true);
    setConnectionError(null);
    
    try {
      await Promise.all([
        loadMonthlyFees(),
        loadAccountsPayable(),
        loadAccountsReceivable(),
      ]);
    } catch (error) {
      handleError(error, 'refreshData');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlyFees = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('monthly_fees')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedFees = data.map(transformMonthlyFee);
      setMonthlyFees(transformedFees);
    } catch (error) {
      handleError(error, 'loadMonthlyFees');
    }
  };

  const loadAccountsPayable = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('accounts_payable')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedAccounts = data.map(transformAccountPayable);
      setAccountsPayable(transformedAccounts);
    } catch (error) {
      handleError(error, 'loadAccountsPayable');
    }
  };

  const loadAccountsReceivable = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('accounts_receivable')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const transformedAccounts = data.map(transformAccountReceivable);
      setAccountsReceivable(transformedAccounts);
    } catch (error) {
      handleError(error, 'loadAccountsReceivable');
    }
  };

  // Calculate metrics whenever data changes
  useEffect(() => {
    if (monthlyFees.length > 0 || accountsPayable.length > 0 || accountsReceivable.length > 0) {
      calculateMetrics();
    }
  }, [monthlyFees, accountsPayable, accountsReceivable]);

  const calculateMetrics = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().slice(0, 7);
    
    // Calculate monthly revenue
    const currentMonthRevenue = monthlyFees
      .filter(fee => fee.month === currentMonth && fee.status === 'paid')
      .reduce((sum, fee) => sum + fee.amount, 0) +
      accountsReceivable
      .filter(acc => acc.receivedDate?.startsWith(currentMonth))
      .reduce((sum, acc) => sum + acc.amount, 0);

    const previousMonthRevenue = monthlyFees
      .filter(fee => fee.month === previousMonth && fee.status === 'paid')
      .reduce((sum, fee) => sum + fee.amount, 0) +
      accountsReceivable
      .filter(acc => acc.receivedDate?.startsWith(previousMonth))
      .reduce((sum, acc) => sum + acc.amount, 0);

    // Calculate monthly expenses
    const currentMonthExpenses = accountsPayable
      .filter(acc => acc.paidDate?.startsWith(currentMonth))
      .reduce((sum, acc) => sum + acc.amount, 0);

    const previousMonthExpenses = accountsPayable
      .filter(acc => acc.paidDate?.startsWith(previousMonth))
      .reduce((sum, acc) => sum + acc.amount, 0);

    // Calculate overdue amounts
    const overdueReceivables = accountsReceivable
      .filter(acc => acc.status === 'overdue')
      .reduce((sum, acc) => sum + acc.amount, 0) +
      monthlyFees
      .filter(fee => fee.status === 'overdue')
      .reduce((sum, fee) => sum + fee.amount + fee.lateFee, 0);

    const overduePayables = accountsPayable
      .filter(acc => acc.status === 'overdue')
      .reduce((sum, acc) => sum + acc.amount, 0);

    // Calculate upcoming dues
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);

    const upcomingDues7Days = accountsPayable
      .filter(acc => acc.status === 'pending' && new Date(acc.dueDate) <= next7Days)
      .reduce((sum, acc) => sum + acc.amount, 0);

    const upcomingDues30Days = accountsPayable
      .filter(acc => acc.status === 'pending' && new Date(acc.dueDate) <= next30Days)
      .reduce((sum, acc) => sum + acc.amount, 0);

    const newMetrics: FinancialMetrics = {
      monthlyRevenue: {
        current: currentMonthRevenue,
        previous: previousMonthRevenue,
        trend: previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0,
      },
      monthlyExpenses: {
        current: currentMonthExpenses,
        previous: previousMonthExpenses,
        trend: previousMonthExpenses > 0 ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 : 0,
      },
      currentBalance: currentMonthRevenue - currentMonthExpenses,
      overdueAmount: {
        receivables: overdueReceivables,
        payables: overduePayables,
      },
      upcomingDues: {
        next7Days: upcomingDues7Days,
        next30Days: upcomingDues30Days,
      },
      cashFlowProjection: {
        next30Days: 0, // Simplified for now
        next60Days: 0,
        next90Days: 0,
      },
    };

    setMetrics(newMetrics);
  };

  // CRUD operations for Monthly Fees
  const addMonthlyFee = async (fee: Omit<MonthlyFee, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('monthly_fees')
      .insert({
        resident_id: fee.residentId,
        amount: fee.amount,
        due_date: fee.dueDate,
        paid_date: fee.paidDate || null,
        discount: fee.discount,
        late_fee: fee.lateFee,
        status: fee.status,
        observations: fee.observations || null,
        payment_method: fee.paymentMethod || null,
        month: fee.month,
        year: fee.year,
        user_id: user.id,
        organization_id: user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding monthly fee:', error);
      throw error;
    }

    const newFee = transformMonthlyFee(data);
    setMonthlyFees(prev => [newFee, ...prev]);
  };

  const updateMonthlyFee = async (id: string, updates: Partial<MonthlyFee>) => {
    if (!user) return;

    const updateData: any = {};
    if (updates.residentId) updateData.resident_id = updates.residentId;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.dueDate) updateData.due_date = updates.dueDate;
    if (updates.paidDate !== undefined) updateData.paid_date = updates.paidDate;
    if (updates.discount !== undefined) updateData.discount = updates.discount;
    if (updates.lateFee !== undefined) updateData.late_fee = updates.lateFee;
    if (updates.status) updateData.status = updates.status;
    if (updates.observations !== undefined) updateData.observations = updates.observations;
    if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
    if (updates.month) updateData.month = updates.month;
    if (updates.year) updateData.year = updates.year;

    let query = supabase
      .from('monthly_fees')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating monthly fee:', error);
      throw error;
    }

    const updatedFee = transformMonthlyFee(data);
    setMonthlyFees(prev => prev.map(fee => fee.id === id ? updatedFee : fee));
  };

  const deleteMonthlyFee = async (id: string) => {
    if (!user) return;

    let query = supabase
      .from('monthly_fees')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting monthly fee:', error);
      throw error;
    }

    setMonthlyFees(prev => prev.filter(fee => fee.id !== id));
  };

  // CRUD operations for Accounts Payable
  const addAccountPayable = async (account: Omit<AccountPayable, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('accounts_payable')
      .insert({
        description: account.description,
        category: account.category,
        supplier: account.supplier,
        amount: account.amount,
        due_date: account.dueDate,
        paid_date: account.paidDate || null,
        payment_method: account.paymentMethod || null,
        cost_center: account.costCenter || null,
        status: account.status,
        observations: account.observations || null,
        attachments: account.attachments || [],
        is_recurring: account.isRecurring,
        recurring_frequency: account.recurringFrequency || null,
        user_id: user.id,
        organization_id: user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding account payable:', error);
      throw error;
    }

    const newAccount = transformAccountPayable(data);
    setAccountsPayable(prev => [newAccount, ...prev]);
  };

  const updateAccountPayable = async (id: string, updates: Partial<AccountPayable>) => {
    if (!user) return;

    const updateData: any = {};
    if (updates.description) updateData.description = updates.description;
    if (updates.category) updateData.category = updates.category;
    if (updates.supplier) updateData.supplier = updates.supplier;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.dueDate) updateData.due_date = updates.dueDate;
    if (updates.paidDate !== undefined) updateData.paid_date = updates.paidDate;
    if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
    if (updates.costCenter !== undefined) updateData.cost_center = updates.costCenter;
    if (updates.status) updateData.status = updates.status;
    if (updates.observations !== undefined) updateData.observations = updates.observations;
    if (updates.attachments) updateData.attachments = updates.attachments;
    if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
    if (updates.recurringFrequency !== undefined) updateData.recurring_frequency = updates.recurringFrequency;

    let query = supabase
      .from('accounts_payable')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating account payable:', error);
      throw error;
    }

    const updatedAccount = transformAccountPayable(data);
    setAccountsPayable(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
  };

  const deleteAccountPayable = async (id: string) => {
    if (!user) return;

    let query = supabase
      .from('accounts_payable')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting account payable:', error);
      throw error;
    }

    setAccountsPayable(prev => prev.filter(acc => acc.id !== id));
  };

  // CRUD operations for Accounts Receivable
  const addAccountReceivable = async (account: Omit<AccountReceivable, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('accounts_receivable')
      .insert({
        description: account.description,
        source: account.source,
        client: account.client,
        amount: account.amount,
        due_date: account.dueDate,
        received_date: account.receivedDate || null,
        payment_method: account.paymentMethod || null,
        status: account.status,
        observations: account.observations || null,
        user_id: user.id,
        organization_id: user.organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding account receivable:', error);
      throw error;
    }

    const newAccount = transformAccountReceivable(data);
    setAccountsReceivable(prev => [newAccount, ...prev]);
  };

  const updateAccountReceivable = async (id: string, updates: Partial<AccountReceivable>) => {
    if (!user) return;

    const updateData: any = {};
    if (updates.description) updateData.description = updates.description;
    if (updates.source) updateData.source = updates.source;
    if (updates.client) updateData.client = updates.client;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.dueDate) updateData.due_date = updates.dueDate;
    if (updates.receivedDate !== undefined) updateData.received_date = updates.receivedDate;
    if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
    if (updates.status) updateData.status = updates.status;
    if (updates.observations !== undefined) updateData.observations = updates.observations;

    let query = supabase
      .from('accounts_receivable')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating account receivable:', error);
      throw error;
    }

    const updatedAccount = transformAccountReceivable(data);
    setAccountsReceivable(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
  };

  const deleteAccountReceivable = async (id: string) => {
    if (!user) return;

    let query = supabase
      .from('accounts_receivable')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting account receivable:', error);
      throw error;
    }

    setAccountsReceivable(prev => prev.filter(acc => acc.id !== id));
  };

  // Generate monthly fees for all residents
  const generateMonthlyFees = async (month: string, year: number) => {
    if (!user) return;

    // Get all residents with their monthly fee amounts
    let query = supabase
      .from('residents')
      .select('id, monthly_fee_amount')
      .eq('user_id', user.id);
    
    // Filter by organization if available
    if (user.organizationId) {
      query = query.eq('organization_id', user.organizationId);
    }

    const { data: residents, error: residentsError } = await query;

    if (residentsError) {
      console.error('Error fetching residents:', residentsError);
      throw residentsError;
    }

    // Check if fees already exist for this month
    let feesQuery = supabase
      .from('monthly_fees')
      .select('id')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year);
    
    // Filter by organization if available
    if (user.organizationId) {
      feesQuery = feesQuery.eq('organization_id', user.organizationId);
    }

    const { data: existingFees, error: feesError } = await feesQuery;

    if (feesError) {
      console.error('Error checking existing fees:', feesError);
      throw feesError;
    }

    if (existingFees.length > 0) {
      throw new Error('Mensalidades já foram geradas para este período');
    }

    // Generate fees for all residents using their individual monthly fee amounts
    const dueDay = 5; // Due on 5th of each month
    const dueDate = new Date(year, parseInt(month.split('-')[1]) - 1, dueDay).toISOString().split('T')[0];

    const feesToCreate = residents.map(resident => ({
      resident_id: resident.id,
      amount: resident.monthly_fee_amount, // Use the resident's individual monthly fee amount
      due_date: dueDate,
      discount: 0,
      late_fee: 0,
      status: 'pending',
      month,
      year,
      user_id: user.id,
      organization_id: user.organizationId
    }));

    const { data, error } = await supabase
      .from('monthly_fees')
      .insert(feesToCreate)
      .select();

    if (error) {
      console.error('Error generating monthly fees:', error);
      throw error;
    }

    const newFees = data.map(transformMonthlyFee);
    setMonthlyFees(prev => [...newFees, ...prev]);
  };

  return (
    <FinancialContext.Provider value={{
      monthlyFees,
      accountsPayable,
      accountsReceivable,
      metrics,
      addMonthlyFee,
      updateMonthlyFee,
      deleteMonthlyFee,
      addAccountPayable,
      updateAccountPayable,
      deleteAccountPayable,
      addAccountReceivable,
      updateAccountReceivable,
      deleteAccountReceivable,
      generateMonthlyFees,
      isLoading,
      refreshData,
      connectionError
    }}>
      {children}
    </FinancialContext.Provider>
  );
};
