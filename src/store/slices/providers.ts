import { StateCreator } from 'zustand';
import {
  activateModal,
  addAkashKey,
  deactivateModal,
  deleteAkashKey,
  deployAkash,
  deployModal,
  getAkashStatus,
  getAkashYaml,
  getModalStatus,
  listAkashKeys,
  rotateAkashKey,
  saveAkashYaml,
  stopAkash,
  undeployModal,
  updateAkashKey,
} from '../../api';
import type { AppStore, ProvidersSlice } from '../types';

let providerPollTimer: ReturnType<typeof setTimeout> | null = null;

function clearProviderPollTimer(): void {
  if (providerPollTimer) {
    clearTimeout(providerPollTimer);
    providerPollTimer = null;
  }
}

export const createProvidersSlice: StateCreator<AppStore, [], [], ProvidersSlice> = (set, get) => {
  const schedulePollIfNeeded = () => {
    const { akash, modal } = get().providers;
    const isRunning = akash?.operation?.state === 'running' || modal?.operation?.state === 'running';
    if (!isRunning) {
      clearProviderPollTimer();
      return;
    }
    if (providerPollTimer) return;
    providerPollTimer = setTimeout(() => {
      providerPollTimer = null;
      get().providers.loadProviders().catch(() => {});
    }, 2500);
  };

  const runAction = async (fn: () => Promise<unknown>, fallbackErr: string) => {
    set((s) => ({ providers: { ...s.providers, loading: true, error: null } }));
    try {
      await fn();
      await get().providers.loadProviders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : fallbackErr;
      set((s) => ({ providers: { ...s.providers, loading: false, error: msg } }));
      throw err;
    }
  };

  return {
    providers: {
      akash: null,
      akashKeys: [],
      akashYaml: '',
      modal: null,
      loading: false,
      error: null,

      loadProviders: async () => {
        set((s) => ({ providers: { ...s.providers, loading: true, error: null } }));
        try {
          const [akashRes, keysRes, modalRes] = await Promise.allSettled([
            getAkashStatus(),
            listAkashKeys(),
            getModalStatus(),
          ]);

          const rawKeys = keysRes.status === 'fulfilled' ? keysRes.value : [];
          const akashKeys = Array.isArray(rawKeys)
            ? rawKeys
            : Array.isArray(rawKeys?.keys)
              ? rawKeys.keys
              : [];

          set((s) => ({
            providers: {
              ...s.providers,
              akash: akashRes.status === 'fulfilled' ? akashRes.value : s.providers.akash,
              akashKeys,
              modal: modalRes.status === 'fulfilled' ? modalRes.value : s.providers.modal,
              loading: false,
            },
          }));
          schedulePollIfNeeded();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Gagal memuat status provider';
          set((s) => ({ providers: { ...s.providers, loading: false, error: msg } }));
        }
      },

      deployAkash: (name) => runAction(() => deployAkash(name), 'Deploy Akash gagal'),

      stopAkash: () => runAction(() => stopAkash(), 'Gagal menghentikan Akash'),

      addAkashKey: async (email, key) => {
        await addAkashKey(email, key);
        await get().providers.loadProviders();
      },

      updateAkashKey: async (id, patch) => {
        await updateAkashKey(id, patch);
        await get().providers.loadProviders();
      },

      rotateAkashKey: async (deadKeyId) => {
        await rotateAkashKey(deadKeyId);
        await get().providers.loadProviders();
      },

      deleteAkashKey: async (identifier) => {
        await deleteAkashKey(identifier);
        await get().providers.loadProviders();
      },

      loadAkashYaml: async () => {
        const res = await getAkashYaml();
        const yaml = res?.content ?? res?.yaml ?? '';
        set((s) => ({ providers: { ...s.providers, akashYaml: yaml } }));
        return yaml;
      },

      saveAkashYaml: async (content) => {
        await saveAkashYaml(content);
        set((s) => ({ providers: { ...s.providers, akashYaml: content } }));
      },

      deployModal: () => runAction(() => deployModal(), 'Deploy Modal gagal'),

      activateModal: () => runAction(() => activateModal(), 'Aktivasi Modal gagal'),

      deactivateModal: () => runAction(() => deactivateModal(), 'Deaktivasi Modal gagal'),

      undeployModal: () => runAction(() => undeployModal(), 'Undeploy Modal gagal'),
    },
  };
};
