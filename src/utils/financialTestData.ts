import { supabase } from '../lib/supabase';

export const createTestFinancialData = async (userId: string, residents: any[], organizationId?: string) => {
  try {
    console.log('Creating test financial data for user:', userId);
    
    // Fetch the current organization_id from user_profiles if not provided
    if (!organizationId) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .single();
      
      if (!userProfileError && userProfile && userProfile.organization_id) {
        organizationId = userProfile.organization_id;
        console.log('Using organization_id from user profile:', organizationId);
      } else {
        console.log('No organization_id found in user profile, using null');
      }
    }
    
    if (residents.length === 0) {
      throw new Error('Nenhum residente encontrado. Crie residentes primeiro.');
    }

    // Create monthly fees for all residents
    const monthlyFees = await createTestMonthlyFees(userId, residents, organizationId);
    
    // Create accounts payable
    const accountsPayable = await createTestAccountsPayable(userId, organizationId);
    
    // Create accounts receivable
    const accountsReceivable = await createTestAccountsReceivable(userId, organizationId);
    
    console.log('Complete test financial data created successfully:', {
      monthlyFees: monthlyFees.length,
      accountsPayable: accountsPayable.length,
      accountsReceivable: accountsReceivable.length
    });
    
    return {
      monthlyFees,
      accountsPayable,
      accountsReceivable
    };
  } catch (error) {
    console.error('Failed to create complete test financial data:', error);
    throw error;
  }
};

const createTestMonthlyFees = async (userId: string, residents: any[], organizationId?: string) => {
  // Fetch the current organization_id from user_profiles if not provided
  if (!organizationId) {
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (!userProfileError && userProfile && userProfile.organization_id) {
      organizationId = userProfile.organization_id;
      console.log('Using organization_id from user profile for monthly fees:', organizationId);
    } else {
      console.log('No organization_id found in user profile for monthly fees, using null');
    }
  }

  const monthlyFees = [];
  const currentDate = new Date();
  
  // Create fees for last 3 months and next 2 months
  for (let monthOffset = -3; monthOffset <= 2; monthOffset++) {
    const feeDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    const month = feeDate.toISOString().slice(0, 7); // YYYY-MM
    const year = feeDate.getFullYear();
    
    residents.forEach((resident) => {
      // Use the resident's individual monthly fee amount
      const baseAmount = resident.monthly_fee_amount || 3000; // Fallback to 3000 if not set
      const dueDay = 5; // Due on 5th of each month
      const dueDate = new Date(feeDate.getFullYear(), feeDate.getMonth(), dueDay).toISOString().split('T')[0];
      
      let status = 'pending';
      let paidDate = null;
      let lateFee = 0;
      let paymentMethod = null;
      
      // For past months, determine payment status
      if (monthOffset < 0) {
        const random = Math.random();
        if (random < 0.85) { // 85% paid on time
          status = 'paid';
          paidDate = new Date(feeDate.getFullYear(), feeDate.getMonth(), dueDay + Math.floor(Math.random() * 5)).toISOString().split('T')[0];
          paymentMethod = ['pix', 'bank_transfer', 'boleto'][Math.floor(Math.random() * 3)];
        } else if (random < 0.95) { // 10% paid late
          status = 'paid';
          const lateDays = Math.floor(Math.random() * 15) + 1;
          paidDate = new Date(feeDate.getFullYear(), feeDate.getMonth(), dueDay + lateDays).toISOString().split('T')[0];
          lateFee = baseAmount * 0.02; // 2% late fee
          paymentMethod = ['pix', 'bank_transfer', 'boleto'][Math.floor(Math.random() * 3)];
        } else { // 5% overdue
          status = 'overdue';
          lateFee = baseAmount * 0.02;
        }
      } else if (monthOffset === 0) {
        // Current month - some paid, some pending
        const random = Math.random();
        if (random < 0.6) { // 60% already paid
          status = 'paid';
          paidDate = new Date(feeDate.getFullYear(), feeDate.getMonth(), Math.floor(Math.random() * currentDate.getDate()) + 1).toISOString().split('T')[0];
          paymentMethod = ['pix', 'bank_transfer', 'boleto'][Math.floor(Math.random() * 3)];
        } else if (new Date() > new Date(dueDate)) {
          status = 'overdue';
          lateFee = baseAmount * 0.02;
        }
      }
      
      monthlyFees.push({
        resident_id: resident.id,
        amount: baseAmount,
        due_date: dueDate,
        paid_date: paidDate,
        discount: 0,
        late_fee: lateFee,
        status,
        observations: status === 'overdue' ? 'Pagamento em atraso' : null,
        payment_method: paymentMethod,
        month,
        year,
        user_id: userId,
        organization_id: organizationId
      });
    });
  }

  console.log('Creating test monthly fees with organization_id:', organizationId);

  const { data, error } = await supabase
    .from('monthly_fees')
    .insert(monthlyFees)
    .select();

  if (error) {
    console.error('Supabase error creating monthly fees:', error);
    throw new Error(`Erro ao criar mensalidades: ${error.message}`);
  }

  return data;
};

const createTestAccountsPayable = async (userId: string, organizationId?: string) => {
  // Fetch the current organization_id from user_profiles if not provided
  if (!organizationId) {
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (!userProfileError && userProfile && userProfile.organization_id) {
      organizationId = userProfile.organization_id;
      console.log('Using organization_id from user profile for accounts payable:', organizationId);
    } else {
      console.log('No organization_id found in user profile for accounts payable, using null');
    }
  }

  const currentDate = new Date();
  const accountsPayable = [];
  
  // Regular monthly expenses
  const monthlyExpenses = [
    { description: 'Folha de Pagamento - Funcionários', category: 'payroll', supplier: 'Empresa Contábil ABC', amount: 45000 },
    { description: 'Medicamentos e Suprimentos Médicos', category: 'medications', supplier: 'Farmácia Central LTDA', amount: 8500 },
    { description: 'Fornecimento de Alimentos', category: 'food', supplier: 'Distribuidora de Alimentos São Paulo', amount: 12000 },
    { description: 'Energia Elétrica', category: 'utilities', supplier: 'Companhia Elétrica', amount: 3200 },
    { description: 'Água e Esgoto', category: 'utilities', supplier: 'Companhia de Saneamento', amount: 1800 },
    { description: 'Internet e Telefone', category: 'utilities', supplier: 'Telecom Brasil', amount: 800 },
    { description: 'Serviços de Limpeza', category: 'professional_services', supplier: 'Empresa de Limpeza Higiene Total', amount: 2500 },
    { description: 'Manutenção Predial', category: 'maintenance', supplier: 'Manutenção Predial Silva & Cia', amount: 2500 },
    { description: 'Impostos e Taxas', category: 'taxes', supplier: 'Receita Federal', amount: 4200 },
    { description: 'Seguro Predial', category: 'insurance', supplier: 'Seguradora XYZ', amount: 1200 }
  ];

  // Create expenses for last 2 months and next 2 months
  for (let monthOffset = -2; monthOffset <= 2; monthOffset++) {
    const expenseDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    
    monthlyExpenses.forEach((expense, index) => {
      const dueDay = 10 + (index * 2); // Spread due dates throughout the month
      const dueDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), Math.min(dueDay, 28)).toISOString().split('T')[0];
      
      let status = 'pending';
      let paidDate = null;
      let paymentMethod = null;
      
      // For past months, most should be paid
      if (monthOffset < 0) {
        const random = Math.random();
        if (random < 0.95) { // 95% paid
          status = 'paid';
          paidDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), dueDay + Math.floor(Math.random() * 5)).toISOString().split('T')[0];
          paymentMethod = ['bank_transfer', 'pix', 'boleto'][Math.floor(Math.random() * 3)];
        } else {
          status = 'overdue';
        }
      } else if (monthOffset === 0) {
        // Current month - some paid, some pending
        const random = Math.random();
        if (random < 0.4) { // 40% already paid
          status = 'paid';
          paidDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), Math.floor(Math.random() * currentDate.getDate()) + 1).toISOString().split('T')[0];
          paymentMethod = ['bank_transfer', 'pix', 'boleto'][Math.floor(Math.random() * 3)];
        } else if (new Date() > new Date(dueDate)) {
          status = 'overdue';
        }
      }
      
      accountsPayable.push({
        description: expense.description,
        category: expense.category,
        supplier: expense.supplier,
        amount: expense.amount + (Math.random() * 500 - 250), // Add some variation
        due_date: dueDate,
        paid_date: paidDate,
        payment_method: paymentMethod,
        cost_center: null,
        status,
        observations: null,
        attachments: [],
        is_recurring: true,
        recurring_frequency: 'monthly',
        user_id: userId,
        organization_id: organizationId
      });
    });
  }

  // Add some one-time expenses
  const oneTimeExpenses = [
    { description: 'Reforma do Refeitório', category: 'maintenance', supplier: 'Construtora ABC', amount: 15000, dueDate: '2024-12-20' },
    { description: 'Equipamentos Médicos', category: 'supplies', supplier: 'MedEquip Ltda', amount: 8500, dueDate: '2024-12-15' },
    { description: 'Consultoria Jurídica', category: 'professional_services', supplier: 'Escritório de Advocacia', amount: 3500, dueDate: '2024-12-10' }
  ];

  oneTimeExpenses.forEach(expense => {
    accountsPayable.push({
      description: expense.description,
      category: expense.category,
      supplier: expense.supplier,
      amount: expense.amount,
      due_date: expense.dueDate,
      paid_date: null,
      payment_method: null,
      cost_center: null,
      status: 'pending',
      observations: 'Despesa extraordinária',
      attachments: [],
      is_recurring: false,
      recurring_frequency: null,
      user_id: userId,
      organization_id: organizationId
    });
  });

  console.log('Creating test accounts payable with organization_id:', organizationId);

  const { data, error } = await supabase
    .from('accounts_payable')
    .insert(accountsPayable)
    .select();

  if (error) {
    console.error('Supabase error creating accounts payable:', error);
    throw new Error(`Erro ao criar contas a pagar: ${error.message}`);
  }

  return data;
};

const createTestAccountsReceivable = async (userId: string, organizationId?: string) => {
  // Fetch the current organization_id from user_profiles if not provided
  if (!organizationId) {
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', userId)
      .single();
    
    if (!userProfileError && userProfile && userProfile.organization_id) {
      organizationId = userProfile.organization_id;
      console.log('Using organization_id from user profile for accounts receivable:', organizationId);
    } else {
      console.log('No organization_id found in user profile for accounts receivable, using null');
    }
  }

  const currentDate = new Date();
  const accountsReceivable = [];
  
  // Regular income sources
  const incomeItems = [
    { description: 'Convênio Médico Unimed', source: 'health_insurance', client: 'Unimed Regional', amount: 25000 },
    { description: 'Convênio Médico Bradesco Saúde', source: 'health_insurance', client: 'Bradesco Saúde', amount: 18000 },
    { description: 'Subsídio Municipal', source: 'government_subsidy', client: 'Prefeitura Municipal', amount: 15000 },
    { description: 'Doação Empresa Local', source: 'donation', client: 'Empresa Beneficente XYZ', amount: 5000 },
    { description: 'Serviços de Fisioterapia Externa', source: 'other_services', client: 'Clínica de Fisioterapia', amount: 3500 }
  ];

  // Create receivables for last 2 months and next 2 months
  for (let monthOffset = -2; monthOffset <= 2; monthOffset++) {
    const receiveDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    
    incomeItems.forEach((income, index) => {
      const dueDay = 15 + (index * 2); // Spread due dates
      const dueDate = new Date(receiveDate.getFullYear(), receiveDate.getMonth(), Math.min(dueDay, 28)).toISOString().split('T')[0];
      
      let status = 'pending';
      let receivedDate = null;
      let paymentMethod = null;
      
      // For past months, most should be received
      if (monthOffset < 0) {
        const random = Math.random();
        if (random < 0.90) { // 90% received
          status = 'received';
          receivedDate = new Date(receiveDate.getFullYear(), receiveDate.getMonth(), dueDay + Math.floor(Math.random() * 10)).toISOString().split('T')[0];
          paymentMethod = ['bank_transfer', 'pix'][Math.floor(Math.random() * 2)];
        } else {
          status = 'overdue';
        }
      } else if (monthOffset === 0) {
        // Current month - some received, some pending
        const random = Math.random();
        if (random < 0.5) { // 50% already received
          status = 'received';
          receivedDate = new Date(receiveDate.getFullYear(), receiveDate.getMonth(), Math.floor(Math.random() * currentDate.getDate()) + 1).toISOString().split('T')[0];
          paymentMethod = ['bank_transfer', 'pix'][Math.floor(Math.random() * 2)];
        } else if (new Date() > new Date(dueDate)) {
          status = 'overdue';
        }
      }
      
      accountsReceivable.push({
        description: income.description,
        source: income.source,
        client: income.client,
        amount: income.amount + (Math.random() * 1000 - 500), // Add some variation
        due_date: dueDate,
        received_date: receivedDate,
        payment_method: paymentMethod,
        status,
        observations: null,
        user_id: userId,
        organization_id: organizationId
      });
    });
  }

  console.log('Creating test accounts receivable with organization_id:', organizationId);

  const { data, error } = await supabase
    .from('accounts_receivable')
    .insert(accountsReceivable)
    .select();

  if (error) {
    console.error('Supabase error creating accounts receivable:', error);
    throw new Error(`Erro ao criar contas a receber: ${error.message}`);
  }

  return data;
};
