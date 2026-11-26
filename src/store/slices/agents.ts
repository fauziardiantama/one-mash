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
  AgentConfigUpdateInput,
  AgentDetailData,
  AgentEffectiveTools,
  AgentSkillItem,
  AgentSummary,
  AgentToolsCatalog,
  AgentToolsPolicyInput,
  AgentWorkspaceFile,
  AgentsSlice,
  AppStore,
  CreateOpenClawAgentInput,
  ModelOption,
  SessionSummary,
} from '../types';

interface OpenClawAgentItem {
  id?: string;
  agentId?: string;
  name?: string;
  identity?: { name?: string; emoji?: string };
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

interface OpenClawAgentEntryConfig {
  name?: string;
  description?: string;
  workspace?: string;
  identity?: { name?: string; emoji?: string; avatar?: string };
  model?: { primary?: string; fallbacks?: string[] } | string;
  thinkingDefault?: string;
  verboseDefault?: string;
  reasoningDefault?: string;
  fastModeDefault?: string | boolean;
  typingMode?: string;
  skills?: string[];
  heartbeat?: { every?: string };
  tools?: {
    profile?: string;
    allow?: string[];
    alsoAllow?: string[];
    deny?: string[];
  };
  subagents?: {
    allowAgents?: string[];
    delegationMode?: string;
  };
}

interface OpenClawConfigGetPayload {
  hash?: string;
  config?: {
    agents?: {
      entries?: Record<string, OpenClawAgentEntryConfig>;
    };
  };
}

interface OpenClawSessionItem {
  key?: string;
  agentId?: string;
  derivedTitle?: string;
  displayName?: string;
  updatedAt?: number;
  model?: string;
  modelProvider?: string;
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
  'TOOLS.md',
  'MEMORY.md',
  'HEARTBEAT.md',
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

async function patchAgentConfigEntry(agentId: string, entryPatch: Record<string, unknown>): Promise<void> {
  const cfgRes = await openclawWs.call<OpenClawConfigGetPayload>('config.get', {});
  await openclawWs.call('config.patch', {
    ...(cfgRes?.hash ? { baseHash: cfgRes.hash } : {}),
    raw: JSON.stringify({ agents: { entries: { [agentId]: entryPatch } } }),
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
    savingConfig: false,
    savingFile: false,
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

        const [configRes, filesListRes, workspaceListRes, picMetaRes, charMetaRes, catalogRes, skillsRes, sessionsRes] =
          await Promise.allSettled([
            openclawWs.call<OpenClawConfigGetPayload>('config.get', {}),
            openclawWs.call<{ files?: AgentWorkspaceFile[] }>('agents.files.list', { agentId }),
            openclawWs.call<{
              entries?: Array<{ name?: string; path?: string; kind?: string; size?: number; updatedAtMs?: number }>;
            }>('agents.workspace.list', { agentId }),
            getProfilePicMeta(agentId),
            getCharacter(agentId),
            openclawWs.call<AgentToolsCatalog>('tools.catalog', { agentId }),
            openclawWs.call<{ skills?: AgentSkillItem[] }>('skills.status', { agentId }),
            openclawWs.call<{ sessions?: OpenClawSessionItem[] }>('sessions.list', { agentId, limit: 30 }),
          ]);

        const entry = configRes.status === 'fulfilled' ? configRes.value?.config?.agents?.entries?.[agentId] : undefined;
        const entryModel = typeof entry?.model === 'string' ? { primary: entry.model } : entry?.model;
        const agentSessions: SessionSummary[] =
          sessionsRes.status === 'fulfilled' && Array.isArray(sessionsRes.value?.sessions)
            ? sessionsRes.value.sessions
                .filter((s) => s.key && (!s.agentId || s.agentId === agentId || s.key.startsWith(`agent:${agentId}:`)))
                .map((s) => ({
                  key: String(s.key),
                  agentId: s.agentId || agentId,
                  title: String(s.derivedTitle || s.displayName || s.key),
                  updatedAt: s.updatedAt,
                  model: s.model,
                  modelProvider: s.modelProvider,
                }))
            : [];

        const effectiveSessionKey =
          agentSessions[0]?.key || (agentId === 'main' ? 'agent:main:main-chat' : `agent:${agentId}:main`);
        let effectiveTools: AgentEffectiveTools | null = null;
        try {
          effectiveTools = await openclawWs.call<AgentEffectiveTools>('tools.effective', {
            agentId,
            sessionKey: effectiveSessionKey,
          });
        } catch {
          effectiveTools = null;
        }

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

        for (const stdName of ['IDENTITY.md', 'AGENTS.md', 'SOUL.md', 'USER.md', 'TOOLS.md', 'MEMORY.md', 'HEARTBEAT.md']) {
          if (!filesMap.has(stdName)) {
            filesMap.set(stdName, { name: stdName, missing: true });
          }
        }

        const preloadNames = Array.from(
          new Set([
            'IDENTITY.md',
            'AGENTS.md',
            ...Array.from(filesMap.values())
              .filter((f) => !f.missing && (f.name === 'SOUL.md' || f.name === 'USER.md' || f.name === 'MEMORY.md'))
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
          name: entry?.name || entry?.identity?.name || existingSummary.name,
          isCharacter: Boolean(characterMeta) || existingSummary.isCharacter,
          description: entry?.description ?? existingSummary.description,
          emoji: entry?.identity?.emoji ?? existingSummary.emoji,
          identityName: entry?.identity?.name ?? existingSummary.identityName,
          modelPrimary: entryModel?.primary ?? existingSummary.modelPrimary,
          modelFallbacks: Array.isArray(entryModel?.fallbacks) ? entryModel.fallbacks : existingSummary.modelFallbacks,
          workspace: entry?.workspace ?? existingSummary.workspace,
          thinkingDefault: entry?.thinkingDefault ?? existingSummary.thinkingDefault,
          verboseDefault: entry?.verboseDefault,
          reasoningDefault: entry?.reasoningDefault,
          fastModeDefault: entry?.fastModeDefault,
          typingMode: entry?.typingMode,
          heartbeatEvery: entry?.heartbeat?.every,
          creator: characterMeta?.creator ?? existingSummary.creator,
          characterVersion: characterMeta?.characterVersion ?? existingSummary.characterVersion,
        };

        const detail: AgentDetailData = {
          agentId,
          summary: mergedSummary,
          toolsProfile: entry?.tools?.profile,
          toolsAllow: Array.isArray(entry?.tools?.allow) ? entry.tools.allow : null,
          toolsAlsoAllow: Array.isArray(entry?.tools?.alsoAllow) ? entry.tools.alsoAllow : [],
          toolsDeny: Array.isArray(entry?.tools?.deny) ? entry.tools.deny : [],
          skillsFilter: Array.isArray(entry?.skills) ? entry.skills : null,
          subagentsAllow: Array.isArray(entry?.subagents?.allowAgents) ? entry.subagents.allowAgents : [],
          subagentsDelegationMode: entry?.subagents?.delegationMode,
          heartbeatEvery: entry?.heartbeat?.every,
          verboseDefault: entry?.verboseDefault,
          reasoningDefault: entry?.reasoningDefault,
          fastModeDefault: entry?.fastModeDefault,
          typingMode: entry?.typingMode,
          effectiveTools,
          toolsCatalog: catalogRes.status === 'fulfilled' ? catalogRes.value : null,
          skills: skillsRes.status === 'fulfilled' && Array.isArray(skillsRes.value?.skills) ? skillsRes.value.skills : [],
          sessions: agentSessions,
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

    saveAgentFile: async (rawAgentId: string, fileName: string, content: string) => {
      const agentId = (rawAgentId || 'main').trim() || 'main';
      set((state) => ({
        agents: { ...state.agents, savingFile: true, error: null },
      }));
      try {
        await openclawWs.call('agents.files.set', {
          agentId,
          name: fileName,
          content,
        });
        const refreshed = await get().agents.loadAgentFile(agentId, fileName);
        if (fileName === 'IDENTITY.md') {
          await get().agents.loadAgentDetail(agentId).catch(() => {});
        }
        set((state) => ({
          agents: { ...state.agents, savingFile: false },
        }));
        return refreshed;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : `Gagal menyimpan ${fileName}`;
        set((state) => ({
          agents: { ...state.agents, savingFile: false, error: msg },
        }));
        throw err;
      }
    },

    createAgent: async (input: CreateOpenClawAgentInput) => {
      set((state) => ({
        agents: { ...state.agents, savingConfig: true, error: null },
      }));
      try {
        const name = input.name.trim();
        if (!name) throw new Error('Nama agen wajib diisi');
        const res = await openclawWs.call<{ agentId: string }>('agents.create', {
          name,
          ...(input.model?.trim() ? { model: input.model.trim() } : {}),
          ...(input.workspace?.trim() ? { workspace: input.workspace.trim() } : {}),
          ...(input.emoji?.trim() ? { emoji: input.emoji.trim() } : {}),
          ...(input.avatar?.trim() ? { avatar: input.avatar.trim() } : {}),
        });
        await get().agents.loadAgents();
        set((state) => ({
          agents: { ...state.agents, savingConfig: false },
        }));
        return res.agentId;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal membuat agen baru';
        set((state) => ({
          agents: { ...state.agents, savingConfig: false, error: msg },
        }));
        throw err;
      }
    },

    updateAgentConfig: async (rawAgentId: string, patch: AgentConfigUpdateInput) => {
      const agentId = (rawAgentId || 'main').trim() || 'main';
      set((state) => ({
        agents: { ...state.agents, savingConfig: true, error: null },
      }));
      try {
        const updatePayload: Record<string, unknown> = { agentId };
        if (patch.name !== undefined && patch.name.trim()) updatePayload.name = patch.name.trim();
        if (patch.emoji !== undefined && patch.emoji !== null) updatePayload.emoji = patch.emoji.trim();
        if (patch.workspace !== undefined && patch.workspace !== null && patch.workspace.trim()) {
          updatePayload.workspace = patch.workspace.trim();
        }
        if (patch.modelPrimary !== undefined) {
          updatePayload.model = patch.modelPrimary ? patch.modelPrimary.trim() : null;
        }
        if (Object.keys(updatePayload).length > 1) {
          await openclawWs.call('agents.update', updatePayload);
        }

        const entryPatch: Record<string, unknown> = {};
        if (patch.description !== undefined) {
          entryPatch.description = patch.description?.trim() ? patch.description.trim() : null;
        }
        if (patch.emoji === null) {
          entryPatch.identity = { emoji: null };
        }
        if (patch.modelPrimary !== undefined || patch.modelFallbacks !== undefined) {
          if (patch.modelPrimary === null) {
            entryPatch.model = null;
          } else {
            const current = get().agents.details[agentId]?.summary;
            const primary = patch.modelPrimary !== undefined ? patch.modelPrimary.trim() : current?.modelPrimary;
            const fallbacks = patch.modelFallbacks ?? current?.modelFallbacks;
            if (primary) {
              entryPatch.model = {
                primary,
                ...(fallbacks && fallbacks.length > 0 ? { fallbacks } : { fallbacks: [] }),
              };
            }
          }
        }
        if (patch.thinkingDefault !== undefined) entryPatch.thinkingDefault = patch.thinkingDefault || null;
        if (patch.verboseDefault !== undefined) entryPatch.verboseDefault = patch.verboseDefault || null;
        if (patch.reasoningDefault !== undefined) entryPatch.reasoningDefault = patch.reasoningDefault || null;
        if (patch.typingMode !== undefined) entryPatch.typingMode = patch.typingMode || null;
        if (patch.heartbeatEvery !== undefined) {
          entryPatch.heartbeat = patch.heartbeatEvery?.trim() ? { every: patch.heartbeatEvery.trim() } : null;
        }
        if (patch.subagentsAllow !== undefined || patch.subagentsDelegationMode !== undefined) {
          entryPatch.subagents = {
            ...(patch.subagentsAllow !== undefined ? { allowAgents: patch.subagentsAllow } : {}),
            ...(patch.subagentsDelegationMode !== undefined
              ? { delegationMode: patch.subagentsDelegationMode || null }
              : {}),
          };
        }

        if (Object.keys(entryPatch).length > 0) {
          await patchAgentConfigEntry(agentId, entryPatch);
        }

        await Promise.all([get().agents.loadAgents(), get().agents.loadAgentDetail(agentId)]);
        set((state) => ({
          agents: { ...state.agents, savingConfig: false },
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memperbarui konfigurasi agen';
        set((state) => ({
          agents: { ...state.agents, savingConfig: false, error: msg },
        }));
        throw err;
      }
    },

    updateAgentToolsPolicy: async (rawAgentId: string, policy: AgentToolsPolicyInput) => {
      const agentId = (rawAgentId || 'main').trim() || 'main';
      set((state) => ({
        agents: { ...state.agents, savingConfig: true, error: null },
      }));
      try {
        const toolsPatch: Record<string, unknown> = {
          profile: policy.profile ? policy.profile : null,
          allow: policy.allow === null ? null : policy.allow ?? [],
          alsoAllow: policy.alsoAllow && policy.alsoAllow.length > 0 ? policy.alsoAllow : null,
          deny: policy.deny && policy.deny.length > 0 ? policy.deny : null,
        };
        await patchAgentConfigEntry(agentId, { tools: toolsPatch });
        await get().agents.loadAgentDetail(agentId);
        set((state) => ({
          agents: { ...state.agents, savingConfig: false },
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memperbarui kebijakan tools';
        set((state) => ({
          agents: { ...state.agents, savingConfig: false, error: msg },
        }));
        throw err;
      }
    },

    updateAgentSkillsFilter: async (rawAgentId: string, skillsFilter: string[] | null) => {
      const agentId = (rawAgentId || 'main').trim() || 'main';
      set((state) => ({
        agents: { ...state.agents, savingConfig: true, error: null },
      }));
      try {
        await patchAgentConfigEntry(agentId, { skills: skillsFilter });
        await get().agents.loadAgentDetail(agentId);
        set((state) => ({
          agents: { ...state.agents, savingConfig: false },
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memperbarui filter skills';
        set((state) => ({
          agents: { ...state.agents, savingConfig: false, error: msg },
        }));
        throw err;
      }
    },

    deleteAgent: async (rawAgentId: string) => {
      const agentId = (rawAgentId || '').trim();
      if (!agentId || agentId === 'main') {
        throw new Error('Agen main tidak dapat dihapus');
      }
      set((state) => ({
        agents: { ...state.agents, savingConfig: true, error: null },
      }));
      try {
        const isChar =
          get().agents.characters.some((c) => c.agentId === agentId) ||
          Boolean(get().agents.list.find((a) => a.id === agentId)?.isCharacter);
        if (isChar) {
          await deleteCharacter(agentId);
        } else {
          await openclawWs.call('agents.delete', { agentId, deleteFiles: true });
          await deleteProfilePic(agentId).catch(() => {});
        }
        set((state) => {
          const nextDetails = { ...state.agents.details };
          delete nextDetails[agentId];
          return {
            agents: {
              ...state.agents,
              savingConfig: false,
              details: nextDetails,
              activeAgentId: state.agents.activeAgentId === agentId ? 'main' : state.agents.activeAgentId,
            },
          };
        });
        await get().agents.loadAgents();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menghapus agen';
        set((state) => ({
          agents: { ...state.agents, savingConfig: false, error: msg },
        }));
        throw err;
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
