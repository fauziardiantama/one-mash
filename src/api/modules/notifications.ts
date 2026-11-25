import { apiRequest } from '../httpClient';

export type NotificationStatus = 'buffered' | 'held' | 'dispatching' | 'dispatched' | 'failed';

export interface NotificationRecord {
  id: number | string;
  source?: string;
  app?: string;
  title?: string;
  body?: string;
  status: NotificationStatus;
  receivedAt: number;
}

export interface NotificationConfigState {
  notification_sleep: boolean;
  counts?: Record<string, number>;
}

export function listNotifications(query?: {
  status?: NotificationStatus;
  source?: string;
  limit?: number;
}): Promise<{ notifications: NotificationRecord[]; counts?: Record<string, number> }> {
  return apiRequest('/notifications', { query });
}

export function listNotificationBatches(): Promise<{ batches: Array<Record<string, unknown>> }> {
  return apiRequest('/notifications/batches');
}

export function getNotificationConfig(): Promise<NotificationConfigState> {
  return apiRequest<NotificationConfigState>('/notifications/config');
}

export function updateNotificationConfig(patch: {
  notification_sleep?: boolean;
  flushHeld?: boolean;
  immediate?: boolean;
}): Promise<NotificationConfigState> {
  return apiRequest<NotificationConfigState>('/notifications/config', {
    method: 'PATCH',
    body: patch,
  });
}

export function flushNotifications(includeHeld = true): Promise<unknown> {
  return apiRequest('/notifications/flush', {
    method: 'POST',
    body: { includeHeld },
  });
}

export function clearNotifications(status?: NotificationStatus): Promise<unknown> {
  return apiRequest('/notifications', {
    method: 'DELETE',
    query: status ? { status } : undefined,
  });
}
