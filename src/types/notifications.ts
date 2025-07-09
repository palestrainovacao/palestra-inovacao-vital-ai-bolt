export interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'health' | 'financial' | 'family' | 'medication' | 'schedule' | 'system' | 'ai';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  residentId?: string;
  residentName?: string;
  priority: 'high' | 'medium' | 'low';
  familyNotified?: boolean;
  resolved?: boolean;
  metadata?: any;
  organizationId?: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  critical: number;
  byCategory: {
    health: number;
    financial: number;
    family: number;
    medication: number;
    schedule: number;
    system: number;
    ai: number;
  };
}
