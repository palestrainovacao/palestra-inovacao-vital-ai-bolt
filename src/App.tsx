import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { FinancialProvider } from './contexts/FinancialContext';
import { HealthProvider } from './contexts/HealthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AIProvider } from './contexts/AIContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Residents } from './pages/Residents';
import { ResidentForm } from './pages/ResidentForm';
import { ResidentDetails } from './pages/ResidentDetails';
import { Medications } from './pages/Medications';
import { MedicationForm } from './pages/MedicationForm';
import { MedicationDetails } from './pages/MedicationDetails';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Financial } from './pages/Financial';
import { FinancialTransactionForm } from './pages/FinancialTransactionForm';
import { MonthlyFeeGeneration } from './pages/MonthlyFeeGeneration';
import DiaperUsage from './pages/DiaperUsage';
import { DiaperUsageForm } from './pages/DiaperUsageForm';
import { DiaperTypeForm } from './pages/DiaperTypeForm';
import { HealthRecords } from './pages/HealthRecords';
import { HealthRecordForm } from './pages/HealthRecordForm';
import { AIAnalytics } from './pages/AIAnalytics';
import { Notifications } from './pages/Notifications';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppProvider>
                <FinancialProvider>
                  <HealthProvider>
                    <NotificationProvider>
                      <AIProvider>
                        <SettingsProvider>
                          <Layout>
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/residents" element={<Residents />} />
                              <Route path="/residents/new" element={<ResidentForm />} />
                              <Route path="/residents/edit/:id" element={<ResidentForm />} />
                              <Route path="/residents/view/:id" element={<ResidentDetails />} />
                              <Route path="/medications" element={<Medications />} />
                              <Route path="/medications/new" element={<MedicationForm />} />
                              <Route path="/medications/edit/:id" element={<MedicationForm />} />
                              <Route path="/medications/view/:id" element={<MedicationDetails />} />
                              <Route path="/diaper-usage" element={<DiaperUsage />} />
                              <Route path="/diaper-usage/new" element={<DiaperUsageForm />} />
                              <Route path="/diaper-usage/edit/:id" element={<DiaperUsageForm />} />
                              <Route path="/diaper-types/new" element={<DiaperTypeForm />} />
                              <Route path="/diaper-types/edit/:id" element={<DiaperTypeForm />} />
                              <Route path="/health-records" element={<HealthRecords />} />
                              <Route path="/health-records/new" element={<HealthRecordForm />} />
                              <Route path="/health-records/edit/:id" element={<HealthRecordForm />} />
                              <Route path="/financial" element={<Financial />} />
                              <Route path="/financial/transactions/new" element={<FinancialTransactionForm />} />
                              <Route path="/financial/transactions/edit/:type/:id" element={<FinancialTransactionForm />} />
                              <Route path="/financial/monthly-fees/generate" element={<MonthlyFeeGeneration />} />
                              <Route path="/reports" element={<Reports />} />
                              <Route path="/ai-analytics" element={<AIAnalytics />} />
                              <Route path="/notifications" element={<Notifications />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                          </Layout>
                        </SettingsProvider>
                      </AIProvider>
                    </NotificationProvider>
                  </HealthProvider>
                </FinancialProvider>
              </AppProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
