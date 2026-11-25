import { StateCreator } from 'zustand';
import type { AppStore, SettingsSlice } from '../types';

export const createSettingsSlice: StateCreator<AppStore, [], [], SettingsSlice> = (set) => ({
  settings: {
    values: {},
    setValue: (key, value) =>
      set((state) => ({
        settings: {
          ...state.settings,
          values: { ...state.settings.values, [key]: value },
        },
      })),
  },
});
