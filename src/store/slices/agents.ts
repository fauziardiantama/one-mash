import { StateCreator } from 'zustand';
import {
  deleteCharacter,
  deleteProfilePic,
  getCharacter,
  getProfilePicMeta,
  importCharacterCard,
  importCharacterJson,
  listCharacters,
  listProfilePics,
  openclawWs,
  parseCharacterCard,
  uploadProfilePic,
} from '../../api';
import type {
  AgentDetailData,
  AgentSummary,
  AgentWorkspaceFile,
  AgentsSlice,
  AppStore,
  ModelOption,
} from '../types';

interface OpenClawAgentItem {
  id?: string;
  agentId?: string;
  name?: string;
  identity?: { name?: string };
  workspace?: string;
  workspaceGit?: boolean;
  agentRuntime?: { id?: string };
  thinkingDefault?: string;
  thinkingOptions?: string[];
  defaultPermissionMode?: string;
  createdVia?: string;
  createdAt?: number;
  model?: { primary?: string; fallbacks?: string[] };
}

interface OpenClawModelItem {
  id?: string;
  name?: string;
  provider?: string;
  tags?: string[];
  available?: boolean;
}

const PRIORITY_DOC_FILES = [
  'IDENTITY.md',
  'AGENTS.md',
  'SOUL.md',
  'USER.md',
  'MEMORY.md',
  'BOOTSTRAP.md',
];

function sortWorkspaceFiles(files: AgentWorkspaceFile[]): AgentWorkspaceFile[] {
  return [...files].sort((a, b) => {
    const idxA = PRIORITY_DOC_FILES.indexOf(a.name);
    const idxB = PRIORITY_DOC_FILES.indexOf(b.name);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
}

export const createAgentsSlice: StateCreator<AppStore, [], [], AgentsSlice> = (set, get) => ({
  agents: {
    list: [{ id: 'main', name: 'Main Agent' }],
    models: [],
    characters: [],
    profilePics: {},
    details: {},
    activeAgentId: 'main',
    loading: false,
    detailLoading: false,
    fileLoading: false,
    uploading: false,
    error: null,

    loadModels: async () => {
      try {
        const res = await openclawWs.call<{ models?: OpenClawModelItem[] }>('models.list', {});
        const raw = Array.isArray(res?.models) ? res.models : [];
        const models: ModelOption[] = raw
          .filter((m) => m.id && m.available !== false)
          .map((m) => {
            const id = String(m.id).trim();
            const provider = String(m.provider || 'litellm').trim();
            return {
              id,
              name: String(m.name || id).trim(),
              provider,
              ref: id.includes('/') ? id : `${provider}/${id}`,
              tags: Array.isArray(m.tags) ? m.tags : undefined,
            };
          });
        set((state) => ({
          agents: { ...state.agents, models },
        }));
      } catch {}
    },

    loadAgents: async () => {
      set((state) => ({
        agents: { ...state.agents, loading: true, error: null },
      }));

      try {
        const [picsRes, charsRes, wsAgentsRes, wsModelsRes] = await Promise.allSettled([
          listProfilePics(),
          listCharacters(),
          openclawWs.call<{ agents?: OpenClawAgentItem[] }>('agents.list', {}),
          openclawWs.call<{ models?: OpenClawModelItem[] }>('models.list', {}),
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
            const fallbackName = id === 'main' ? 'Main Agent' : a.identity?.name || a.name || id;
            mergedMap.set(id, {
              id,
              name: charInfo?.characterName || fallbackName,
              isCharacter: Boolean(charInfo),
              description: charInfo?.description,
              avatarVersion: picsMap[id]?.sha256,
              modelPrimary: a.model?.primary,
              modelFallbacks: Array.isArray(a.model?.fallbacks) ? a.model.fallbacks : undefined,
              workspace: a.workspace,
              workspaceGit: a.workspaceGit,
              thinkingDefault: a.thinkingDefault,
              thinkingOptions: Array.isArray(a.thinkingOptions) ? a.thinkingOptions : undefined,
              defaultPermissionMode: a.defaultPermissionMode,
              runtimeId: a.agentRuntime?.id,
              createdVia: a.createdVia,
              createdAt: a.createdAt ?? charInfo?.createdAt,
              identityName: a.identity?.name,
              creator: charInfo?.creator ?? null,
              characterVersion: charInfo?.characterVersion ?? null,
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
              createdAt: ch.createdAt,
              creator: ch.creator ?? null,
              characterVersion: ch.characterVersion ?? null,
            });
          }
        }

        const models: ModelOption[] =
          wsModelsRes.status === 'fulfilled' && Array.isArray(wsModelsRes.value?.models)
            ? wsModelsRes.value.models
                .filter((m) => m.id && m.available !== false)
                .map((m) => {
                  const id = String(m.id).trim();
                  const provider = String(m.provider || 'litellm').trim();
                  return {
                    id,
                    name: String(m.name || id).trim(),
                    provider,
                    ref: id.includes('/') ? id : `${provider}/${id}`,
                    tags: Array.isArray(m.tags) ? m.tags : undefined,
                  };
                })
            : get().agents.models;

        const list = Array.from(mergedMap.values());
        const currentActive = get().agents.activeAgentId;
        const activeStillExists = list.some((a) => a.id === currentActive);
        const activeAgent = list.find((a) => a.id === (activeStillExists ? currentActive : 'main'));

        set((state) => ({
          agents: {
            ...state.agents,
            list,
            models,
            characters,
            profilePics: picsMap,
            activeAgentId: activeStillExists ? currentActive : 'main',
            loading: false,
            error: null,
          },
          chat: {
            ...state.chat,
            activeSessionModel:
              state.chat.activeSessionModel || activeAgent?.modelPrimary || null,
          },
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat daftar agen';
        set((state) => ({
          agents: { ...state.agents, loading: false, error: msg },
        }));
      }
    },

    loadAgentDetail: async (rawAgentId: string) => {
      const agentId = (rawAgentId || 'main').trim() || 'main';
      set((state) => ({
        agents: { ...state.agents, detailLoading: true, error: null },
      }));

      try {
        if (get().agents.list.length <= 1) {
          await get().agents.loadAgents().catch(() => {});
        }

        const existingSummary = get().agents.list.find((a) => a.id === agentId) || {
          id: agentId,
          name: agentId === 'main' ? 'Main Agent' : agentId,
          isCharacter: get().agents.characters.some((c) => c.agentId === agentId),
        };

        const [configRes, filesListRes, workspaceListRes, picMetaRes, charMetaRes] =
          await Promise.allSettled([
            openclawWs.call<{
              config?: {
                agents?: {
                  entries?: Record<
                    string,
                    {
                      model?: { primary?: string; fallbacks?: string[] };
                      tools?: { allow?: string[]; deny?: string[] };
                      subagents?: { allowAgents?: string[] };
                      workspace?: string;
                    }
                  >;
                };
              };
            }>('config.get', {}),
            openclawWs.call<{ files?: AgentWorkspaceFile[] }>('agents.files.list', { agentId }),
            openclawWs.call<{
              entries?: Array<{ name?: string; path?: string; kind?: string; size?: number; updatedAtMs?: number }>;
            }>('agents.workspace.list', { agentId }),
            getProfilePicMeta(agentId),
            getCharacter(agentId),
          ]);

        const entry = configRes.status === 'fulfilled' ? configRes.value?.config?.agents?.entries?.[agentId] : undefined;
        const filesMap = new Map<string, AgentWorkspaceFile>();

        if (filesListRes.status === 'fulfilled' && Array.isArray(filesListRes.value?.files)) {
          for (const f of filesListRes.value.files) {
            if (f?.name) filesMap.set(f.name, { ...f });
          }
        }

        if (workspaceListRes.status === 'fulfilled' && Array.isArray(workspaceListRes.value?.entries)) {
          for (const item of workspaceListRes.value.entries) {
            if (item.kind !== 'file' || !item.name) continue;
            if (!filesMap.has(item.name)) {
              filesMap.set(item.name, {
                name: item.name,
                path: item.path,
                size: item.size,
                updatedAtMs: item.updatedAtMs,
                missing: false,
              });
            }
          }
        }

        // Always ensure IDENTITY.md & AGENTS.md are attempted even if omitted by files.list
        const preloadNames = Array.from(
          new Set([
            'IDENTITY.md',
            'AGENTS.md',
            ...Array.from(filesMap.values())
              .filter((f) => !f.missing && (f.name === 'SOUL.md' || f.name === 'USER.md'))
              .map((f) => f.name),
          ]),
        );

        const preloaded = await Promise.allSettled(
          preloadNames.map((name) =>
            openclawWs.call<{ file?: AgentWorkspaceFile }>('agents.files.get', { agentId, name }),
          ),
        );
        preloaded.forEach((outcome, idx) => {
          const name = preloadNames[idx];
          if (outcome.status === 'fulfilled' && outcome.value?.file) {
            filesMap.set(name, { ...filesMap.get(name), ...outcome.value.file, name });
          }
        });

        const characterMeta = charMetaRes.status === 'fulfilled' ? charMetaRes.value : null;
        const profilePicMeta = picMetaRes.status === 'fulfilled' ? picMetaRes.value : null;

        const mergedSummary: AgentSummary = {
          ...existingSummary,
          isCharacter: Boolean(characterMeta) || existingSummary.isCharacter,
          modelPrimary: existingSummary.modelPrimary || entry?.model?.primary,
          modelFallbacks:
            existingSummary.modelFallbacks ||
            (Array.isArray(entry?.model?.fallbacks) ? entry.model.fallbacks : undefined),
          workspace: existingSummary.workspace || entry?.workspace,
          creator: characterMeta?.creator ?? existingSummary.creator,
          characterVersion: characterMeta?.characterVersion ?? existingSummary.characterVersion,
        };

        const detail: AgentDetailData = {
          agentId,
          summary: mergedSummary,
          toolsAllow: Array.isArray(entry?.tools?.allow) ? entry.tools.allow : [],
          toolsDeny: Array.isArray(entry?.tools?.deny) ? entry.tools.deny : [],
          subagentsAllow: Array.isArray(entry?.subagents?.allowAgents) ? entry.subagents.allowAgents : [],
          files: sortWorkspaceFiles(Array.from(filesMap.values())),
          profilePicMeta,
          characterMeta,
          loadedAt: Date.now(),
        };

        set((state) => ({
          agents: {
            ...state.agents,
            detailLoading: false,
            details: { ...state.agents.details, [agentId]: detail },
          },
        }));
        return detail;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat detail agen';
        set((state) => ({
          agents: { ...state.agents, detailLoading: false, error: msg },
        }));
        throw err;
      }
    },

    loadAgentFile: async (rawAgentId: string, fileName: string) => {
      const agentId = (rawAgentId || 'main').trim() || 'main';
      set((state) => ({
        agents: { ...state.agents, fileLoading: true },
      }));
      try {
        const res = await openclawWs.call<{ file?: AgentWorkspaceFile }>('agents.files.get', {
          agentId,
          name: fileName,
        });
        const fetched = res?.file ? { ...res.file, name: fileName } : null;
        if (fetched) {
          set((state) => {
            const existing = state.agents.details[agentId];
            if (!existing) return { agents: { ...state.agents, fileLoading: false } };
            const nextFiles = existing.files.some((f) => f.name === fileName)
              ? existing.files.map((f) => (f.name === fileName ? { ...f, ...fetched } : f))
              : sortWorkspaceFiles([...existing.files, fetched]);
            return {
              agents: {
                ...state.agents,
                fileLoading: false,
                details: {
                  ...state.agents.details,
                  [agentId]: { ...existing, files: nextFiles },
                },
              },
            };
          });
        } else {
          set((state) => ({ agents: { ...state.agents, fileLoading: false } }));
        }
        return fetched;
      } catch {
        set((state) => ({ agents: { ...state.agents, fileLoading: false } }));
        return null;
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
