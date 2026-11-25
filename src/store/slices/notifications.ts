import { StateCreator } from 'zustand';
import {
  clearNotifications,
  flushNotifications,
  getNotificationConfig,
  listNotificationBatches,
  listNotifications,
  notificationsWs,
  updateNotificationConfig,
} from '../../api';
import type { AppStore, NotificationsSlice } from '../types';

export const createNotificationsSlice: StateCreator<AppStore, [], [], NotificationsSlice> = (
  set,
  get,
) => ({
  notifications: {
    list: [],
    batches: [],
    config: { notification_sleep: false, counts: {} },
    loading: false,
    error: null,

    loadNotifications: async () => {
      set((s) => ({ notifications: { ...s.notifications, loading: true, error: null } }));
      try {
        const [notifRes, cfgRes, batchRes] = await Promise.all([
          listNotifications({ limit: 100 }),
          getNotificationConfig(),
          listNotificationBatches(),
        ]);
        set((s) => ({
          notifications: {
            ...s.notifications,
            list: notifRes.notifications || [],
            batches: batchRes.batches || [],
            config: cfgRes || { notification_sleep: false, counts: {} },
            loading: false,
          },
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat notifikasi Ear';
        set((s) => ({ notifications: { ...s.notifications, loading: false, error: msg } }));
      }
    },

    toggleSleep: async (sleep, flushHeld = true) => {
      const cfg = await updateNotificationConfig({
        notification_sleep: sleep,
        flushHeld,
      });
      set((s) => ({
        notifications: { ...s.notifications, config: cfg },
      }));
      await get().notifications.loadNotifications();
    },

    flushNow: async () => {
      await flushNotifications(true);
      await get().notifications.loadNotifications();
    },

    clearAll: async () => {
      await clearNotifications();
      await get().notifications.loadNotifications();
    },

    startRealtime: () => {
      notificationsWs.start(() => {
        get().notifications.loadNotifications().catch(() => {});
      });
    },

    stopRealtime: () => {
      notificationsWs.stop();
    },
  },
});
