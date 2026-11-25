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

export const createProvidersSlice: StateCreator<AppStore, [], [], ProvidersSlice> = (set, get) => ({
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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat status provider';
        set((s) => ({ providers: { ...s.providers, loading: false, error: msg } }));
      }
    },

    deployAkash: async (name) => {
      set((s) => ({ providers: { ...s.providers, loading: true, error: null } }));
      try {
        await deployAkash(name);
        await get().providers.loadProviders();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Deploy Akash gagal';
        set((s) => ({ providers: { ...s.providers, loading: false, error: msg } }));
        throw err;
      }
    },

    stopAkash: async () => {
      set((s) => ({ providers: { ...s.providers, loading: true, error: null } }));
      try {
        await stopAkash();
        await get().providers.loadProviders();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menghentikan Akash';
        set((s) => ({ providers: { ...s.providers, loading: false, error: msg } }));
        throw err;
      }
    },

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

    deployModal: async () => {
      set((s) => ({ providers: { ...s.providers, loading: true, error: null } }));
      try {
        await deployModal();
        await get().providers.loadProviders();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Deploy Modal gagal';
        set((s) => ({ providers: { ...s.providers, loading: false, error: msg } }));
        throw err;
      }
    },

    activateModal: async () => {
      set((s) => ({ providers: { ...s.providers, loading: true, error: null } }));
      try {
        await activateModal();
        await get().providers.loadProviders();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Aktivasi Modal gagal';
        set((s) => ({ providers: { ...s.providers, loading: false, error: msg } }));
        throw err;
      }
    },

    deactivateModal: async () => {
      set((s) => ({ providers: { ...s.providers, loading: true, error: null } }));
      try {
        await deactivateModal();
        await get().providers.loadProviders();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Deaktivasi Modal gagal';
        set((s) => ({ providers: { ...s.providers, loading: false, error: msg } }));
        throw err;
      }
    },

    undeployModal: async () => {
      set((s) => ({ providers: { ...s.providers, loading: true, error: null } }));
      try {
        await undeployModal();
        await get().providers.loadProviders();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Undeploy Modal gagal';
        set((s) => ({ providers: { ...s.providers, loading: false, error: msg } }));
        throw err;
      }
    },
  },
});
