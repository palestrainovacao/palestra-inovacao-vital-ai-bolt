import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { useFinancial } from './FinancialContext';
import { useHealth } from './HealthContext';
import { Notification, NotificationSummary } from '../types/notifications';
import { format, isAfter, isBefore, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

interface NotificationContextType {
  notifications: Notification[];
  summary: NotificationSummary;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsFamilyNotified: (id: string) => Promise<void>;
  markAsResolved: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { 
    residents, 
    medications, 
    familyMessages, 
    caregivers 
  } = useApp();
  const { 
    monthlyFees, 
    accountsPayable, 
    accountsReceivable 
  } = useFinancial();
  const { 
    vitalSigns, 
    eliminationRecords, 
    intercurrences 
  } = useHealth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      generateSystemNotifications();
    } else {
      setNotifications([]);
    }
  }, [
    user,
    residents,
    medications,
    familyMessages,
    caregivers,
    monthlyFees,
    accountsPayable,
    accountsReceivable,
    vitalSigns,
    eliminationRecords,
    intercurrences
  ]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }
      
      const transformedNotifications: Notification[] = data.map(item => ({
        id: item.id,
        type: item.type as Notification['type'],
        category: item.category as Notification['category'],
        title: item.title,
        message: item.message,
        timestamp: item.timestamp,
        read: item.read,
        actionUrl: item.action_url || undefined,
        residentId: item.resident_id || undefined,
        residentName: item.resident_name || undefined,
        priority: item.priority as Notification['priority'],
        familyNotified: item.family_notified || false,
        resolved: item.resolved || false,
        metadata: item.metadata || {},
        organizationId: item.organization_id
      }));
      
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSystemNotifications = async () => {
    if (!user) return;
    
    const newNotifications: Partial<Notification>[] = [];
    const now = new Date();

    // 1. HEALTH NOTIFICATIONS (Critical Priority)
    
    // Critical intercurrences in last 24h
    const recentCriticalIntercurrences = intercurrences.filter(i => {
      const occurredAt = parseISO(i.occurredAt);
      const last24h = addDays(now, -1);
      return isAfter(occurredAt, last24h) && i.severity === 'critical';
    });

    recentCriticalIntercurrences.forEach(intercurrence => {
      const resident = residents.find(r => r.id === intercurrence.residentId);
      newNotifications.push({
        type: 'critical',
        category: 'health',
        title: 'Intercorrência Crítica',
        message: `${resident?.name}: ${intercurrence.description}`,
        timestamp: intercurrence.occurredAt,
        read: false,
        actionUrl: '/health-records',
        residentId: intercurrence.residentId,
        residentName: resident?.name,
        priority: 'high',
        organizationId: user.organizationId
      });
    });

    // Residents with critical health status
    const criticalResidents = residents.filter(r => r.healthStatus === 'critical');
    criticalResidents.forEach(resident => {
      newNotifications.push({
        type: 'critical',
        category: 'health',
        title: 'Paciente em Estado Crítico',
        message: `${resident.name} requer monitoramento contínuo`,
        timestamp: now.toISOString(),
        read: false,
        actionUrl: '/residents',
        residentId: resident.id,
        residentName: resident.name,
        priority: 'high',
        organizationId: user.organizationId
      });
    });

    // Abnormal vital signs (last 24h)
    const recentVitalSigns = vitalSigns.filter(vs => {
      const recordedAt = parseISO(vs.recordedAt);
      const last24h = addDays(now, -1);
      return isAfter(recordedAt, last24h);
    });

    recentVitalSigns.forEach(vs => {
      const resident = residents.find(r => r.id === vs.residentId);
      const alerts = [];

      // Check for abnormal values
      if (vs.systolicPressure && (vs.systolicPressure > 180 || vs.systolicPressure < 90)) {
        alerts.push(`Pressão sistólica: ${vs.systolicPressure}mmHg`);
      }
      if (vs.oxygenSaturation && vs.oxygenSaturation < 90) {
        alerts.push(`Saturação: ${vs.oxygenSaturation}%`);
      }
      if (vs.temperature && (vs.temperature > 38.5 || vs.temperature < 35.5)) {
        alerts.push(`Temperatura: ${vs.temperature}°C`);
      }
      if (vs.heartRate && (vs.heartRate > 120 || vs.heartRate < 50)) {
        alerts.push(`FC: ${vs.heartRate}bpm`);
      }

      if (alerts.length > 0) {
        newNotifications.push({
          type: 'warning',
          category: 'health',
          title: 'Sinais Vitais Alterados',
          message: `${resident?.name}: ${alerts.join(', ')}`,
          timestamp: vs.recordedAt,
          read: false,
          actionUrl: '/health-records',
          residentId: vs.residentId,
          residentName: resident?.name,
          priority: 'high',
          organizationId: user.organizationId
        });
      }
    });

    // 2. MEDICATION NOTIFICATIONS

    // Medications ending soon (next 7 days)
    const medicationsEndingSoon = medications.filter(m => {
      if (!m.endDate || m.status !== 'active') return false;
      const endDate = parseISO(m.endDate);
      const next7Days = addDays(now, 7);
      return isBefore(endDate, next7Days) && isAfter(endDate, now);
    });

    medicationsEndingSoon.forEach(medication => {
      const resident = residents.find(r => r.id === medication.residentId);
      newNotifications.push({
        type: 'warning',
        category: 'medication',
        title: 'Medicação Terminando',
        message: `${resident?.name}: ${medication.name} termina em ${format(parseISO(medication.endDate!), 'dd/MM/yyyy')}`,
        timestamp: now.toISOString(),
        read: false,
        actionUrl: '/medications',
        residentId: medication.residentId,
        residentName: resident?.name,
        priority: 'medium',
        organizationId: user.organizationId
      });
    });

    // 3. FAMILY NOTIFICATIONS

    // Unread family messages
    const unreadFamilyMessages = familyMessages.filter(m => !m.read);
    const emergencyMessages = unreadFamilyMessages.filter(m => m.type === 'emergency');
    const regularMessages = unreadFamilyMessages.filter(m => m.type !== 'emergency');

    // Emergency messages (high priority)
    emergencyMessages.forEach(message => {
      const resident = residents.find(r => r.id === message.residentId);
      newNotifications.push({
        type: 'critical',
        category: 'family',
        title: 'Mensagem de Emergência',
        message: `${message.from}: ${message.message.substring(0, 50)}...`,
        timestamp: message.date,
        read: false,
        actionUrl: '/family',
        residentId: message.residentId,
        residentName: resident?.name,
        priority: 'high',
        organizationId: user.organizationId
      });
    });

    // Regular unread messages (grouped)
    if (regularMessages.length > 0) {
      newNotifications.push({
        type: 'info',
        category: 'family',
        title: 'Mensagens Não Lidas',
        message: `${regularMessages.length} mensagem${regularMessages.length > 1 ? 's' : ''} de familiares`,
        timestamp: regularMessages[0].date,
        read: false,
        actionUrl: '/family',
        priority: 'medium',
        organizationId: user.organizationId
      });
    }

    // 4. FINANCIAL NOTIFICATIONS

    // Overdue monthly fees
    const overdueMonthlyFees = monthlyFees.filter(fee => fee.status === 'overdue');
    if (overdueMonthlyFees.length > 0) {
      const totalOverdue = overdueMonthlyFees.reduce((sum, fee) => sum + fee.amount + fee.lateFee, 0);
      newNotifications.push({
        type: 'warning',
        category: 'financial',
        title: 'Mensalidades em Atraso',
        message: `${overdueMonthlyFees.length} mensalidades em atraso - Total: R$ ${totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        timestamp: now.toISOString(),
        read: false,
        actionUrl: '/financial',
        priority: 'medium',
        organizationId: user.organizationId
      });
    }

    // Accounts payable due in next 7 days
    const upcomingPayables = accountsPayable.filter(acc => {
      if (acc.status !== 'pending') return false;
      const dueDate = parseISO(acc.dueDate);
      const next7Days = addDays(now, 7);
      return isBefore(dueDate, next7Days) && isAfter(dueDate, now);
    });

    if (upcomingPayables.length > 0) {
      const totalAmount = upcomingPayables.reduce((sum, acc) => sum + acc.amount, 0);
      newNotifications.push({
        type: 'info',
        category: 'financial',
        title: 'Contas a Vencer',
        message: `${upcomingPayables.length} contas vencem nos próximos 7 dias - Total: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        timestamp: now.toISOString(),
        read: false,
        actionUrl: '/financial',
        priority: 'medium',
        organizationId: user.organizationId
      });
    }

    // Overdue accounts payable
    const overduePayables = accountsPayable.filter(acc => acc.status === 'overdue');
    if (overduePayables.length > 0) {
      const totalOverdue = overduePayables.reduce((sum, acc) => sum + acc.amount, 0);
      newNotifications.push({
        type: 'warning',
        category: 'financial',
        title: 'Contas em Atraso',
        message: `${overduePayables.length} contas em atraso - Total: R$ ${totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        timestamp: now.toISOString(),
        read: false,
        actionUrl: '/financial',
        priority: 'high',
        organizationId: user.organizationId
      });
    }

    // 6. SYSTEM NOTIFICATIONS (for admins)
    if (user?.role === 'admin') {
      // Low number of active caregivers
      const activeCaregivers = caregivers.filter(c => c.status === 'active');
      if (activeCaregivers.length < 3) {
        newNotifications.push({
          type: 'warning',
          category: 'system',
          title: 'Poucos Cuidadores Ativos',
          message: `Apenas ${activeCaregivers.length} cuidadores ativos no sistema`,
          timestamp: now.toISOString(),
          read: false,
          actionUrl: '/settings',
          priority: 'medium',
          organizationId: user.organizationId
        });
      }
    }

    // Salvar notificações no banco de dados
    if (newNotifications.length > 0) {
      try {
        // Verificar quais notificações já existem para evitar duplicatas
        let query = supabase
          .from('notifications')
          .select('title, message, category')
          .eq('user_id', user.id)
          .in('category', newNotifications.map(n => n.category));
        
        // Filter by organization if available
        if (user.organizationId) {
          query = query.eq('organization_id', user.organizationId);
        }
        
        const existingNotifications = await query;
        
        if (existingNotifications.error) {
          console.error('Error checking existing notifications:', existingNotifications.error);
          return;
        }
        
        // Filtrar apenas notificações novas
        const existingSet = new Set(
          existingNotifications.data.map(n => `${n.title}|${n.message.substring(0, 50)}|${n.category}`)
        );
        
        const uniqueNotifications = newNotifications.filter(n => 
          !existingSet.has(`${n.title}|${n.message.substring(0, 50)}|${n.category}`)
        );
        
        if (uniqueNotifications.length > 0) {
          // Preparar dados para inserção
          const notificationsToInsert = uniqueNotifications.map(n => ({
            user_id: user.id,
            type: n.type,
            category: n.category,
            title: n.title,
            message: n.message,
            timestamp: n.timestamp,
            read: n.read,
            action_url: n.actionUrl,
            resident_id: n.residentId,
            resident_name: n.residentName,
            priority: n.priority,
            source: 'system',
            family_notified: false,
            resolved: false,
            organization_id: user.organizationId
          }));
          
          const { error } = await supabase
            .from('notifications')
            .insert(notificationsToInsert);
          
          if (error) {
            console.error('Error inserting notifications:', error);
          } else {
            // Recarregar notificações após inserção
            loadNotifications();
          }
        }
      } catch (error) {
        console.error('Error generating system notifications:', error);
      }
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const markAsFamilyNotified = async (id: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('notifications')
        .update({ family_notified: true })
        .eq('id', id)
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('Error marking notification as family notified:', error);
        return;
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, familyNotified: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as family notified:', error);
    }
  };

  const markAsResolved = async (id: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('notifications')
        .update({ resolved: true })
        .eq('id', id)
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('Error marking notification as resolved:', error);
        return;
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, resolved: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as resolved:', error);
    }
  };

  const clearNotification = async (id: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }
      
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      // Filter by organization if available
      if (user.organizationId) {
        query = query.eq('organization_id', user.organizationId);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('Error deleting all notifications:', error);
        return;
      }
      
      setNotifications([]);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
    generateSystemNotifications();
  };

  // Calculate summary
  const summary: NotificationSummary = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    critical: notifications.filter(n => n.type === 'critical').length,
    byCategory: {
      health: notifications.filter(n => n.category === 'health').length,
      financial: notifications.filter(n => n.category === 'financial').length,
      family: notifications.filter(n => n.category === 'family').length,
      medication: notifications.filter(n => n.category === 'medication').length,
      schedule: notifications.filter(n => n.category === 'schedule').length,
      system: notifications.filter(n => n.category === 'system').length,
      ai: notifications.filter(n => n.category === 'ai').length
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      summary,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
      refreshNotifications,
      markAsFamilyNotified,
      markAsResolved
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
