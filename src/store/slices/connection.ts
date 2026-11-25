import { StateCreator } from 'zustand';
import {
  DEFAULT_BACKEND_URL,
  checkHealth,
  getOpenClawBootstrapStatus,
  openclawWs,
  runOpenClawBootstrap,
  sanitizeBaseUrl,
  setApiBaseUrl,
} from '../../api';
import type { AppStore, ConnectionSlice } from '../types';

export const createConnectionSlice: StateCreator<AppStore, [], [], ConnectionSlice> = (set, get) => ({
  connection: {
    baseUrl: DEFAULT_BACKEND_URL,
    hasConfiguredUrl: false,
    connected: false,
    bootstrapStatus: null,
    loading: false,
    bootstrapLoading: false,
    error: null,

    setBaseUrl: (url: string) => {
      const sanitized = sanitizeBaseUrl(url) || DEFAULT_BACKEND_URL;
      setApiBaseUrl(sanitized);
      set((state) => ({
        connection: { ...state.connection, baseUrl: sanitized, hasConfiguredUrl: true },
      }));
    },

    clearError: () =>
      set((state) => ({
        connection: { ...state.connection, error: null },
      })),

    disconnect: () => {
      openclawWs.disconnect();
      get().notifications.stopRealtime();
      set((state) => ({
        connection: {
          ...state.connection,
          hasConfiguredUrl: false,
          connected: false,
          bootstrapStatus: null,
          error: null,
        },
      }));
    },

    checkStartupConnection: async () => {
      const { baseUrl, hasConfiguredUrl } = get().connection;
      if (!hasConfiguredUrl || !baseUrl) {
        setApiBaseUrl(baseUrl || DEFAULT_BACKEND_URL);
        return 'connect';
      }

      setApiBaseUrl(baseUrl);
      set((state) => ({
        connection: { ...state.connection, loading: true, error: null },
      }));

      try {
        await checkHealth();
        let bootStatus = null;
        try {
          bootStatus = await getOpenClawBootstrapStatus();
          if (!bootStatus.configured) {
            await runOpenClawBootstrap(false);
            bootStatus = await getOpenClawBootstrapStatus();
          }
        } catch {
          // Non-fatal: still allow entering chat if /health succeeded
        }

        set((state) => ({
          connection: {
            ...state.connection,
            connected: true,
            bootstrapStatus: bootStatus,
            loading: false,
            error: null,
          },
        }));

        get().agents.loadAgents().catch(() => {});
        get().groups.loadGroups().catch(() => {});
        get().notifications.loadNotifications().catch(() => {});
        get().notifications.startRealtime();
        return 'chat';
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal terhubung ke backend';
        set((state) => ({
          connection: {
            ...state.connection,
            connected: false,
            loading: false,
            error: msg,
          },
        }));
        return 'connect';
      }
    },

    connectToBackend: async (rawUrl: string) => {
      const sanitized = sanitizeBaseUrl(rawUrl);
      if (!sanitized) {
        set((state) => ({
          connection: { ...state.connection, error: 'URL backend tidak boleh kosong.' },
        }));
        return false;
      }

      setApiBaseUrl(sanitized);
      set((state) => ({
        connection: { ...state.connection, loading: true, error: null },
      }));

      try {
        await checkHealth();
        let bootStatus = null;
        try {
          bootStatus = await getOpenClawBootstrapStatus();
          if (!bootStatus.configured) {
            await runOpenClawBootstrap(false);
            bootStatus = await getOpenClawBootstrapStatus();
          }
        } catch {
          // Non-fatal
        }

        set((state) => ({
          connection: {
            ...state.connection,
            baseUrl: sanitized,
            hasConfiguredUrl: true,
            connected: true,
            bootstrapStatus: bootStatus,
            loading: false,
            error: null,
          },
        }));

        get().agents.loadAgents().catch(() => {});
        get().groups.loadGroups().catch(() => {});
        get().notifications.loadNotifications().catch(() => {});
        get().notifications.startRealtime();
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Tidak dapat menghubungi server backend';
        set((state) => ({
          connection: {
            ...state.connection,
            connected: false,
            loading: false,
            error: msg,
          },
        }));
        return false;
      }
    },

    refreshBootstrap: async () => {
      try {
        const bootStatus = await getOpenClawBootstrapStatus();
        set((state) => ({
          connection: { ...state.connection, bootstrapStatus: bootStatus },
        }));
        return bootStatus;
      } catch {
        return null;
      }
    },

    triggerBootstrap: async (force = false) => {
      set((state) => ({
        connection: { ...state.connection, bootstrapLoading: true, error: null },
      }));
      try {
        await runOpenClawBootstrap(force);
        const bootStatus = await getOpenClawBootstrapStatus();
        set((state) => ({
          connection: {
            ...state.connection,
            bootstrapStatus: bootStatus,
            bootstrapLoading: false,
          },
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Bootstrap OpenClaw gagal';
        set((state) => ({
          connection: {
            ...state.connection,
            bootstrapLoading: false,
            error: msg,
          },
        }));
        throw err;
      }
    },
  },
});
