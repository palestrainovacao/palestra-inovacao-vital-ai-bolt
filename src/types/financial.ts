// Financial Types
export interface MonthlyFee {
  id: string;
  residentId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  discount: number;
  lateFee: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  observations?: string;
  paymentMethod?: PaymentMethod;
  month: string; // YYYY-MM format
  year: number;
  organizationId?: string;
}

export interface AccountPayable {
  id: string;
  description: string;
  category: ExpenseCategory;
  supplier: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  costCenter?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  observations?: string;
  attachments?: string[];
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'yearly';
  organizationId?: string;
}

export interface AccountReceivable {
  id: string;
  description: string;
  source: RevenueSource;
  client: string;
  amount: number;
  dueDate: string;
  receivedDate?: string;
  paymentMethod?: PaymentMethod;
  status: 'pending' | 'received' | 'overdue' | 'cancelled';
  observations?: string;
  organizationId?: string;
}

export interface CashFlowEntry {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  balance: number;
  reference?: string; // Reference to MonthlyFee, AccountPayable, etc.
  organizationId?: string;
}

export interface FinancialReport {
  id: string;
  type: ReportType;
  title: string;
  period: {
    start: string;
    end: string;
  };
  data: any;
  generatedAt: string;
  generatedBy: string;
  organizationId?: string;
}

export interface FinancialSettings {
  defaultDueDay: number;
  lateFeePercentage: number;
  monthlyInterestRate: number;
  earlyPaymentDiscount: number;
  bankAccounts: BankAccount[];
  paymentMethods: PaymentMethod[];
  expenseCategories: ExpenseCategory[];
  revenueCategories: RevenueSource[];
  organizationId?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  balance: number;
  isActive: boolean;
  organizationId?: string;
}

export type PaymentMethod = 
  | 'cash' 
  | 'pix' 
  | 'bank_transfer' 
  | 'boleto' 
  | 'credit_card' 
  | 'debit_card' 
  | 'check';

export type ExpenseCategory = 
  | 'payroll'
  | 'medications'
  | 'food'
  | 'maintenance'
  | 'utilities'
  | 'taxes'
  | 'insurance'
  | 'supplies'
  | 'professional_services'
  | 'others';

export type RevenueSource = 
  | 'monthly_fee'
  | 'health_insurance'
  | 'donation'
  | 'other_services'
  | 'government_subsidy'
  | 'others';

export type ReportType = 
  | 'income_statement'
  | 'cash_flow'
  | 'accounts_receivable'
  | 'accounts_payable'
  | 'overdue_analysis'
  | 'cost_center'
  | 'supplier_analysis';

// Dashboard Metrics
export interface FinancialMetrics {
  monthlyRevenue: {
    current: number;
    previous: number;
    trend: number;
  };
  monthlyExpenses: {
    current: number;
    previous: number;
    trend: number;
  };
  currentBalance: number;
  overdueAmount: {
    receivables: number;
    payables: number;
  };
  upcomingDues: {
    next7Days: number;
    next30Days: number;
  };
  cashFlowProjection: {
    next30Days: number;
    next60Days: number;
    next90Days: number;
  };
}

// Database types
export interface DatabaseMonthlyFee {
  id: string;
  resident_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  discount: number;
  late_fee: number;
  status: string;
  observations: string | null;
  payment_method: string | null;
  month: string;
  year: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  organization_id?: string;
}

export interface DatabaseAccountPayable {
  id: string;
  description: string;
  category: string;
  supplier: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
  cost_center: string | null;
  status: string;
  observations: string | null;
  attachments: string[];
  is_recurring: boolean;
  recurring_frequency: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  organization_id?: string;
}

export interface DatabaseAccountReceivable {
  id: string;
  description: string;
  source: string;
  client: string;
  amount: number;
  due_date: string;
  received_date: string | null;
  payment_method: string | null;
  status: string;
  observations: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  organization_id?: string;
}
