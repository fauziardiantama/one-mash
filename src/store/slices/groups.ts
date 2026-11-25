import { StateCreator } from 'zustand';
import { createGroup as apiCreateGroup, listGroups } from '../../api';
import type { AppStore, GroupsSlice } from '../types';

export const createGroupsSlice: StateCreator<AppStore, [], [], GroupsSlice> = (set) => ({
  groups: {
    list: [],
    loading: false,
    error: null,

    loadGroups: async () => {
      set((s) => ({ groups: { ...s.groups, loading: true, error: null } }));
      try {
        const res = await listGroups();
        const list = Array.isArray(res) ? res : Array.isArray(res?.groups) ? res.groups : [];
        set((s) => ({ groups: { ...s.groups, list, loading: false } }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat daftar grup';
        set((s) => ({ groups: { ...s.groups, loading: false, error: msg } }));
      }
    },

    createGroup: async (name, members) => {
      const created = await apiCreateGroup(name, members);
      set((s) => ({
        groups: { ...s.groups, list: [created, ...s.groups.list] },
      }));
      return created;
    },
  },
});
