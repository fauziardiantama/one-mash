import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createAgentsSlice } from './slices/agents';
import { createChatSlice } from './slices/chat';
import { createConnectionSlice } from './slices/connection';
import { createGroupsSlice } from './slices/groups';
import { createNotificationsSlice } from './slices/notifications';
import { createProvidersSlice } from './slices/providers';
import { createSettingsSlice } from './slices/settings';
import type { AppStore } from './types';

export type { AppStore } from './types';

export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createConnectionSlice(...a),
      ...createAgentsSlice(...a),
      ...createChatSlice(...a),
      ...createProvidersSlice(...a),
      ...createGroupsSlice(...a),
      ...createNotificationsSlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: 'one-mash-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        connection: {
          baseUrl: state.connection.baseUrl,
          hasConfiguredUrl: state.connection.hasConfiguredUrl,
        },
        agents: {
          activeAgentId: state.agents.activeAgentId,
        },
        chat: {
          mainSessionKeys: state.chat.mainSessionKeys,
        },
        settings: {
          values: state.settings.values,
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState || {}) as Partial<AppStore>;
        return {
          ...currentState,
          connection: {
            ...currentState.connection,
            ...(persisted.connection || {}),
          },
          agents: {
            ...currentState.agents,
            ...(persisted.agents || {}),
          },
          chat: {
            ...currentState.chat,
            ...(persisted.chat || {}),
            mainSessionKeys: persisted.chat?.mainSessionKeys || currentState.chat.mainSessionKeys,
          },
          settings: {
            ...currentState.settings,
            ...(persisted.settings || {}),
          },
        };
      },
    },
  ),
);
