import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle, Info, User, Shield, Stethoscope, Heart, Building } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'nurse' | 'caregiver' | 'coordinator'>('caregiver');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [creatingDemo, setCreatingDemo] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [createOrganization, setCreateOrganization] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
  
  const { 
    login, 
    signUp, 
    isLoading, 
    createOrganization: createOrg, 
    getOrganizations: fetchOrganizations 
  } = useAuth();

  // Load organizations when component mounts
  React.useEffect(() => {
    const loadOrganizations = async () => {
      setIsLoadingOrganizations(true);
      try {
        const orgs = await fetchOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0) {
          setSelectedOrganizationId(orgs[0].id);
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setIsLoadingOrganizations(false);
      }
    };

    loadOrganizations();
  }, [fetchOrganizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Email e senha são obrigatórios');
      return;
    }

    try {
      let success = false;
      
      if (isSignUp) {
        if (!name.trim()) {
          setError('Nome é obrigatório');
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres');
          return;
        }

        // If creating a new organization
        let organizationId: string | undefined;
        if (createOrganization && organizationName.trim()) {
          // Only admins can create organizations
          if (role !== 'admin') {
            setError('Apenas administradores podem criar novas organizações');
            return;
          }
          
          organizationId = await createOrg(organizationName);
          if (!organizationId) {
            setError('Erro ao criar organização. Tente novamente.');
            return;
          }
        } else if (!createOrganization && selectedOrganizationId) {
          organizationId = selectedOrganizationId;
        }

        try {
          success = await signUp(email, password, name, role, organizationId);
          if (success) {
            setSuccess('Conta criada com sucesso! Você já está logado.');
            // Clear form
            setEmail('');
            setPassword('');
            setName('');
            setRole('caregiver');
            setOrganizationName('');
            setCreateOrganization(false);
            setLoginAttempts(0);
            return;
          } else {
            setError('Erro ao criar conta. Verifique se o email já não está em uso ou se a senha atende aos requisitos.');
          }
        } catch (signUpError: any) {
          setError(signUpError.message || 'Erro ao criar conta. Verifique suas permissões.');
          return;
        }
      } else {
        success = await login(email, password);
        if (!success) {
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          
          if (newAttempts === 1) {
            setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
          } else if (newAttempts >= 2) {
            setError('Credenciais incorretas. Para contas de demonstração, você deve primeiro CRIAR a conta clicando no botão "Criar" ao lado da conta desejada. As contas de demonstração não existem até serem criadas.');
          }
        } else {
          setLoginAttempts(0);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Erro inesperado. Tente novamente.');
    }
  };

  const switchMode = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
    setError('');
    setSuccess('');
    setLoginAttempts(0);
    // Clear form when switching modes
    setEmail('');
    setPassword('');
    setName('');
    setRole('caregiver');
    setOrganizationName('');
    setCreateOrganization(false);
  };

  const demoAccounts = [
    { role: 'admin', name: 'Administrador', email: 'admin@ilpi.com', password: 'senha123', icon: Shield, color: 'bg-red-100 text-red-800' },
    { role: 'coordinator', name: 'Coordenador', email: 'coord@ilpi.com', password: 'senha123', icon: User, color: 'bg-blue-100 text-blue-800' },
    { role: 'nurse', name: 'Enfermeiro', email: 'enfermeiro@ilpi.com', password: 'senha123', icon: Stethoscope, color: 'bg-green-100 text-green-800' },
    { role: 'caregiver', name: 'Cuidador', email: 'cuidador@ilpi.com', password: 'senha123', icon: Heart, color: 'bg-purple-100 text-purple-800' }
  ];

  const setDemoAccount = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError('');
    setSuccess('');
  };

  const createDemoAccount = async (demoAccount: typeof demoAccounts[0]) => {
    setError('');
    setSuccess('');
    setCreatingDemo(demoAccount.role);
    
    try {
      // Create organization if none exists
      let organizationId: string | undefined;
      if (organizations.length === 0) {
        organizationId = await createOrg('Organização Demo');
        if (!organizationId) {
          setError('Erro ao criar organização de demonstração. Verifique as permissões do sistema.');
          setCreatingDemo(null);
          return;
        }
        
        // Refresh organizations list
        const orgs = await fetchOrganizations();
        setOrganizations(orgs);
      } else {
        organizationId = organizations[0].id;
      }
      
      const success = await signUp(
        demoAccount.email, 
        demoAccount.password, 
        demoAccount.name, 
        demoAccount.role as any,
        organizationId
      );
      
      if (success) {
        setSuccess(`Conta de demonstração "${demoAccount.name}" criada e você já está logado!`);
        // Clear any filled demo credentials since user is now logged in
        setEmail('');
        setPassword('');
      } else {
        setError(`Erro ao criar conta de demonstração. O email ${demoAccount.email} pode já estar em uso.`);
      }
    } catch (err) {
      console.error('Demo account creation error:', err);
      setError('Erro ao criar conta de demonstração. Verifique as configurações do sistema.');
    } finally {
      setCreatingDemo(null);
    }
  };

  // Show/hide organization creation based on role
  const showOrgCreation = role === 'admin';
  
  // If role is not admin and createOrganization was true, reset it
  React.useEffect(() => {
    if (role !== 'admin' && createOrganization) {
      setCreateOrganization(false);
    }
  }, [role, createOrganization]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ILPI Manager</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestão de Idosos</p>
        </div>

        {/* Toggle between Login and Sign Up */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !isSignUp 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchMode(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isSignUp 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                {isSignUp ? 'Criando sua primeira conta:' : 'Como acessar o sistema:'}
              </h3>
              <div className="text-xs text-blue-700 space-y-1">
                {isSignUp ? (
                  <>
                    <p>• Preencha todos os campos obrigatórios</p>
                    <p>• A senha deve ter pelo menos 6 caracteres</p>
                    <p>• Escolha sua função no sistema</p>
                    <p>• Selecione ou crie uma organização (apenas administradores)</p>
                    <p>• Após criar a conta, você será logado automaticamente</p>
                  </>
                ) : (
                  <>
                    <p>• <strong>Primeira vez?</strong> Clique em "Criar Conta" para se registrar</p>
                    <p>• <strong>Demonstração:</strong> Clique em "Criar" para criar uma conta de teste</p>
                    <p>• <strong>Já tem conta?</strong> Use seu email e senha cadastrados</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Show helpful message after failed login attempts */}
        {!isSignUp && loginAttempts >= 2 && !error.includes('Erro inesperado') && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 mb-2">
                  Problemas para entrar?
                </h3>
                <div className="text-xs text-amber-700 space-y-1">
                  <p>• <strong>Contas de demonstração:</strong> Clique em "Criar" primeiro, depois será logado automaticamente</p>
                  <p>• <strong>Conta própria:</strong> Use "Criar Conta" para registrar um novo usuário</p>
                  <p>• <strong>Credenciais incorretas:</strong> Verifique se a conta existe no sistema</p>
                  <p>• <strong>Senha correta:</strong> Para contas demo, a senha é sempre "senha123"</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Accounts */}
        {!isSignUp && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2 mb-3">
              <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-green-800">
                  Contas de Demonstração
                </h3>
                <p className="text-xs text-green-700">
                  Crie contas de teste para explorar o sistema
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((account) => (
                <div key={account.role} className={`flex items-center justify-between p-2 rounded-lg ${account.color}`}>
                  <div className="flex items-center space-x-2">
                    <account.icon className="w-4 h-4" />
                    <div>
                      <div className="font-medium text-sm">{account.name}</div>
                      <div className="text-xs opacity-75">{account.email}</div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setDemoAccount(account.email, account.password)}
                      className="px-2 py-1 bg-white bg-opacity-50 hover:bg-opacity-75 rounded text-xs font-medium transition-colors"
                      title="Preencher campos do formulário (só funciona se a conta já foi criada)"
                    >
                      Usar
                    </button>
                    <button
                      type="button"
                      onClick={() => createDemoAccount(account)}
                      disabled={isLoading || creatingDemo === account.role}
                      className="px-2 py-1 bg-white bg-opacity-50 hover:bg-opacity-75 rounded text-xs font-medium transition-colors disabled:opacity-50 min-w-[40px]"
                      title="Criar esta conta e fazer login automaticamente"
                    >
                      {creatingDemo === account.role ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-current mx-auto"></div>
                      ) : (
                        'Criar'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 text-xs text-center text-green-700 space-y-1">
              <p><strong>⚠️ IMPORTANTE:</strong></p>
              <p>1. <strong>PRIMEIRO</strong> clique em <strong>"Criar"</strong> para criar a conta no sistema</p>
              <p>2. Isso fará login automaticamente - você não precisa digitar nada</p>
              <p>3. Ou use <strong>"Usar"</strong> apenas se a conta já foi criada antes</p>
              <p className="mt-2 font-medium">Senha padrão: <span className="bg-white bg-opacity-50 px-1 rounded">senha123</span></p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Seu nome completo"
                  required={isSignUp}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Função *
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="caregiver">Cuidador</option>
                  <option value="nurse">Enfermeiro(a)</option>
                  <option value="coordinator">Coordenador(a)</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organização *
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="join-organization"
                      checked={!createOrganization}
                      onChange={() => setCreateOrganization(false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="join-organization" className="text-sm text-gray-700">
                      Entrar em uma organização existente
                    </label>
                  </div>
                  
                  {!createOrganization && (
                    <select
                      value={selectedOrganizationId}
                      onChange={(e) => setSelectedOrganizationId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      disabled={isLoadingOrganizations || organizations.length === 0}
                    >
                      {isLoadingOrganizations ? (
                        <option>Carregando organizações...</option>
                      ) : organizations.length === 0 ? (
                        <option>Nenhuma organização encontrada</option>
                      ) : (
                        organizations.map(org => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))
                      )}
                    </select>
                  )}
                  
                  {showOrgCreation && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="create-organization"
                        checked={createOrganization}
                        onChange={() => setCreateOrganization(true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="create-organization" className="text-sm text-gray-700">
                        Criar uma nova organização
                      </label>
                    </div>
                  )}
                  
                  {createOrganization && showOrgCreation && (
                    <div>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="Nome da organização"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        required={createOrganization}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Você será o administrador desta organização
                      </p>
                    </div>
                  )}
                  
                  {!showOrgCreation && (
                    <div className="text-xs text-amber-600 mt-1">
                      Apenas administradores podem criar novas organizações
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha * {isSignUp && <span className="text-xs text-gray-500">(mínimo 6 caracteres)</span>}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                placeholder="••••••••"
                required
                minLength={isSignUp ? 6 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || creatingDemo !== null}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                <span>{isSignUp ? 'Criar Conta' : 'Entrar'}</span>
              </>
            )}
          </button>
        </form>

        {/* Additional Help */}
        {!isSignUp && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta ainda?{' '}
              <button
                type="button"
                onClick={() => switchMode(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Criar nova conta
              </button>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          Sistema desenvolvido para gestão de ILPIs
          <br />
          Versão 1.0.0 - Powered by Supabase
        </div>
      </div>
    </div>
  );
};
