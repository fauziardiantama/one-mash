import { StateCreator } from 'zustand';
import {
  deleteCharacter,
  deleteProfilePic,
  importCharacterCard,
  importCharacterJson,
  listCharacters,
  listProfilePics,
  openclawWs,
  parseCharacterCard,
  uploadProfilePic,
} from '../../api';
import type { AgentSummary, AgentsSlice, AppStore } from '../types';

interface OpenClawAgentItem {
  id?: string;
  agentId?: string;
  name?: string;
  identity?: { name?: string };
}

export const createAgentsSlice: StateCreator<AppStore, [], [], AgentsSlice> = (set, get) => ({
  agents: {
    list: [{ id: 'main', name: 'Main Agent' }],
    characters: [],
    profilePics: {},
    activeAgentId: 'main',
    loading: false,
    uploading: false,
    error: null,

    loadAgents: async () => {
      set((state) => ({
        agents: { ...state.agents, loading: true, error: null },
      }));

      try {
        const [picsRes, charsRes, wsAgentsRes] = await Promise.allSettled([
          listProfilePics(),
          listCharacters(),
          openclawWs.call<{ agents?: OpenClawAgentItem[] }>('agents.list', {}),
        ]);

        const picsMap: Record<string, { agentId: string; mimeType: string; sha256: string }> = {};
        if (picsRes.status === 'fulfilled' && Array.isArray(picsRes.value?.profilePics)) {
          for (const pic of picsRes.value.profilePics) {
            picsMap[pic.agentId] = pic;
          }
        }

        const characters =
          charsRes.status === 'fulfilled' && Array.isArray(charsRes.value?.characters)
            ? charsRes.value.characters
            : get().agents.characters;

        const charMap = new Map(characters.map((c) => [c.agentId, c]));
        const mergedMap = new Map<string, AgentSummary>();

        mergedMap.set('main', {
          id: 'main',
          name: 'Main Agent',
          avatarVersion: picsMap.main?.sha256,
        });

        if (wsAgentsRes.status === 'fulfilled' && Array.isArray(wsAgentsRes.value?.agents)) {
          for (const a of wsAgentsRes.value.agents) {
            const id = (a.id || a.agentId || '').trim();
            if (!id) continue;
            const charInfo = charMap.get(id);
            mergedMap.set(id, {
              id,
              name: charInfo?.characterName || a.identity?.name || a.name || id,
              isCharacter: Boolean(charInfo),
              description: charInfo?.description,
              avatarVersion: picsMap[id]?.sha256,
            });
          }
        }

        for (const ch of characters) {
          if (!mergedMap.has(ch.agentId)) {
            mergedMap.set(ch.agentId, {
              id: ch.agentId,
              name: ch.characterName || ch.agentId,
              isCharacter: true,
              description: ch.description,
              avatarVersion: picsMap[ch.agentId]?.sha256,
            });
          }
        }

        const list = Array.from(mergedMap.values());
        const currentActive = get().agents.activeAgentId;
        const activeStillExists = list.some((a) => a.id === currentActive);

        set((state) => ({
          agents: {
            ...state.agents,
            list,
            characters,
            profilePics: picsMap,
            activeAgentId: activeStillExists ? currentActive : 'main',
            loading: false,
            error: null,
          },
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat daftar agen';
        set((state) => ({
          agents: { ...state.agents, loading: false, error: msg },
        }));
      }
    },

    selectAgent: (agentId: string) => {
      const target = (agentId || 'main').trim() || 'main';
      set((state) => ({
        agents: { ...state.agents, activeAgentId: target },
      }));
      get().chat.openDirectChat(target).catch(() => {});
    },

    uploadAvatar: async (agentId, file) => {
      set((state) => ({
        agents: { ...state.agents, uploading: true, error: null },
      }));
      try {
        const meta = await uploadProfilePic(agentId, file);
        set((state) => ({
          agents: {
            ...state.agents,
            uploading: false,
            profilePics: { ...state.agents.profilePics, [agentId]: meta },
            list: state.agents.list.map((a) =>
              a.id === agentId ? { ...a, avatarVersion: meta.sha256 || String(Date.now()) } : a,
            ),
          },
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal mengunggah avatar';
        set((state) => ({
          agents: { ...state.agents, uploading: false, error: msg },
        }));
        throw err;
      }
    },

    removeAvatar: async (agentId) => {
      set((state) => ({
        agents: { ...state.agents, uploading: true, error: null },
      }));
      try {
        await deleteProfilePic(agentId);
        set((state) => {
          const nextPics = { ...state.agents.profilePics };
          delete nextPics[agentId];
          return {
            agents: {
              ...state.agents,
              uploading: false,
              profilePics: nextPics,
              list: state.agents.list.map((a) =>
                a.id === agentId ? { ...a, avatarVersion: undefined } : a,
              ),
            },
          };
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menghapus avatar';
        set((state) => ({
          agents: { ...state.agents, uploading: false, error: msg },
        }));
        throw err;
      }
    },

    parseCard: async (file) => {
      return parseCharacterCard(file);
    },

    importCard: async (file) => {
      set((state) => ({
        agents: { ...state.agents, uploading: true, error: null },
      }));
      try {
        const res = await importCharacterCard(file);
        await get().agents.loadAgents();
        set((state) => ({
          agents: { ...state.agents, uploading: false },
        }));
        return res.agentId || res.character?.agentId;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal mengimpor Character Card';
        set((state) => ({
          agents: { ...state.agents, uploading: false, error: msg },
        }));
        throw err;
      }
    },

    importCardJson: async (json) => {
      set((state) => ({
        agents: { ...state.agents, uploading: true, error: null },
      }));
      try {
        const res = await importCharacterJson(json);
        await get().agents.loadAgents();
        set((state) => ({
          agents: { ...state.agents, uploading: false },
        }));
        return res.agentId || res.character?.agentId;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal mengimpor JSON Character Card';
        set((state) => ({
          agents: { ...state.agents, uploading: false, error: msg },
        }));
        throw err;
      }
    },

    removeCharacter: async (agentId) => {
      await deleteCharacter(agentId);
      if (get().agents.activeAgentId === agentId) {
        set((state) => ({
          agents: { ...state.agents, activeAgentId: 'main' },
        }));
      }
      await get().agents.loadAgents();
    },
  },
});
