import { StateCreator } from 'zustand';
import { getGroup, openclawWs, postGroupMessage, type GroupMessageItem, type OpenClawChatEvent } from '../../api';
import type { AppStore, ChatMessage, ChatSlice, SessionSummary, ToolActivityItem } from '../types';

let wsBound = false;
let groupPollTimer: ReturnType<typeof setTimeout> | null = null;

function stopGroupPoll(): void {
  if (groupPollTimer) {
    clearTimeout(groupPollTimer);
    groupPollTimer = null;
  }
}

function mapGroupHistory(groupId: string, history: GroupMessageItem[] = []): ChatMessage[] {
  return history.map((h, i) => ({
    id: `grp-${groupId}-${i}`,
    role: h.speaker === 'user' ? 'user' : 'ai',
    author: h.speaker === 'user' ? 'Anda' : h.speaker,
    text: h.text || '',
    createdAt: h.ts || h.createdAt,
  }));
}

export const MAIN_CHAT_SESSION_KEY = 'agent:main:main-chat';
export const NOTIFICATION_HISTORY_SESSION_KEY = 'agent:main:notification-history';

export function extractSessionIdSuffix(key: string): string {
  const trimmed = key.trim();
  if (!trimmed.toLowerCase().startsWith('agent:')) return trimmed;
  const parts = trimmed.split(':');
  return parts.length >= 3 ? parts.slice(2).join(':') : trimmed;
}

export function isHiddenSystemSessionKey(key: string): boolean {
  const suffix = extractSessionIdSuffix(key).toLowerCase();
  return (
    suffix === 'main-chat' ||
    suffix === 'main' ||
    suffix === 'notification-history' ||
    suffix === 'notifications' ||
    suffix.startsWith('group-') ||
    suffix.startsWith('group:')
  );
}

interface OpenClawHistoryMsg {
  role?: string;
  content?: string | Array<{ type?: string; text?: string; name?: string; arguments?: unknown; [k: string]: unknown }>;
  timestamp?: number;
  id?: string;
}

function extractTextContent(content: OpenClawHistoryMsg['content']): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((b) => (b.type === 'text' || !b.type) && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('');
}

function formatShortTime(ts?: number): string {
  const d = ts ? new Date(ts) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m}${ampm}`;
}

function extractToolActivities(rawMessages: OpenClawHistoryMsg[]): ToolActivityItem[] {
  const items: ToolActivityItem[] = [];
  rawMessages.forEach((msg, idx) => {
    if (!Array.isArray(msg.content)) return;
    msg.content.forEach((block, bIdx) => {
      if (block.type === 'toolCall' || block.type === 'tool_use') {
        const toolName = String(block.name || 'Tool');
        const ts = msg.timestamp || Date.now();
        items.push({
          id: `tool-${idx}-${bIdx}`,
          toolName,
          title: toolName.charAt(0).toUpperCase() + toolName.slice(1),
          subtitle: 'Dieksekusi oleh agen di sesi aktif',
          time: formatShortTime(ts),
          rawDate: new Date(ts),
          detail: block.arguments ? JSON.stringify(block.arguments, null, 2) : 'Pemanggilan tool OpenClaw.',
          stepDesc: `Executed ${toolName}`,
          statusLabel: 'Selesai',
        });
      }
    });
  });
  return items.reverse();
}

function makeUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const createChatSlice: StateCreator<AppStore, [], [], ChatSlice> = (set, get) => {
  const scheduleGroupPoll = (groupId: string, attemptsLeft = 90) => {
    stopGroupPoll();
    if (attemptsLeft <= 0) {
      set((s) => ({
        chat: {
          ...s.chat,
          isStreaming: false,
          error: 'Waktu tunggu balasan agen grup habis, coba muat ulang grup.',
        },
      }));
      return;
    }

    groupPollTimer = setTimeout(async () => {
      groupPollTimer = null;
      const cur = get().chat;
      if (cur.mode !== 'group' || cur.activeGroupId !== groupId) return;

      try {
        const detail = await getGroup(groupId);
        const latest = get().chat;
        if (latest.mode !== 'group' || latest.activeGroupId !== groupId) return;

        const mapped = mapGroupHistory(groupId, detail.history || []);
        const stillRunning = Boolean(detail.pendingTurn?.active);
        const turnError = detail.pendingTurn?.error || null;

        set((s) => ({
          chat: {
            ...s.chat,
            messages: mapped,
            isStreaming: stillRunning,
            error: !stillRunning && turnError ? turnError : s.chat.error,
          },
        }));

        if (stillRunning) {
          scheduleGroupPoll(groupId, attemptsLeft - 1);
        }
      } catch {
        scheduleGroupPoll(groupId, attemptsLeft - 1);
      }
    }, 2000);
  };

  return {
    chat: {
    mode: 'direct',
    activeGroupId: null,
    activeSessionKey: MAIN_CHAT_SESSION_KEY,
    activeSessionModel: null,
    activeSessionModelOverridden: false,
    switchingModel: false,
    mainSessionKeys: { main: MAIN_CHAT_SESSION_KEY },
    sessions: [],
    messages: [],
    toolActivities: [],
    replyTo: null,
    wsStatus: 'disconnected',
    isStreaming: false,
    activeRunId: null,
    loading: false,
    error: null,

    setReplyTo: (replyTo) =>
      set((state) => ({
        chat: { ...state.chat, replyTo },
      })),

    initWsBindings: () => {
      if (wsBound) return;
      wsBound = true;

      openclawWs.setListeners({
        onStatusChange: (wsStatus) => {
          set((state) => ({
            chat: { ...state.chat, wsStatus },
          }));
        },
        onError: (msg) => {
          set((state) => ({
            chat: { ...state.chat, error: msg, isStreaming: false },
          }));
        },
        onChatEvent: (payload: OpenClawChatEvent) => {
          const state = get();
          if (state.chat.mode !== 'direct') return;
          if (payload.sessionKey && payload.sessionKey !== state.chat.activeSessionKey) return;
          if (state.chat.activeRunId && payload.runId && payload.runId !== state.chat.activeRunId) return;

          const text = extractTextContent(payload.message?.content);

          if (payload.state === 'delta') {
            set((s) => {
              const msgs = [...s.chat.messages];
              const lastIdx = msgs.length - 1;
              const last = lastIdx >= 0 ? msgs[lastIdx] : null;
              if (last && last.role === 'ai' && last.streaming) {
                msgs[lastIdx] = { ...last, text: text || last.text };
              } else {
                msgs.push({
                  id: `ai-stream-${payload.runId || Date.now()}`,
                  role: 'ai',
                  text,
                  streaming: true,
                });
              }
              return {
                chat: {
                  ...s.chat,
                  messages: msgs,
                  isStreaming: true,
                  wsStatus: 'streaming',
                },
              };
            });
          } else if (payload.state === 'final') {
            set((s) => {
              const msgs = [...s.chat.messages];
              const lastIdx = msgs.length - 1;
              const last = lastIdx >= 0 ? msgs[lastIdx] : null;
              if (last && last.role === 'ai' && last.streaming) {
                msgs[lastIdx] = { ...last, text: text || last.text, streaming: false };
              } else if (text) {
                msgs.push({
                  id: `ai-${payload.runId || Date.now()}`,
                  role: 'ai',
                  text,
                  streaming: false,
                });
              }
              return {
                chat: {
                  ...s.chat,
                  messages: msgs,
                  isStreaming: false,
                  activeRunId: null,
                  wsStatus: 'connected',
                },
              };
            });
          } else if (payload.state === 'error' || payload.state === 'aborted') {
            set((s) => ({
              chat: {
                ...s.chat,
                isStreaming: false,
                activeRunId: null,
                wsStatus: 'connected',
                error: payload.state === 'error' ? payload.errorMessage || 'Eksekusi chat gagal' : null,
              },
            }));
          }
        },
      });
    },

    openDirectChat: async (targetAgentId, explicitSessionKey) => {
      stopGroupPoll();
      get().chat.initWsBindings();
      const agentId = (targetAgentId || get().agents.activeAgentId || 'main').trim();
      const defaultKey =
        agentId === 'main'
          ? MAIN_CHAT_SESSION_KEY
          : get().chat.mainSessionKeys[agentId] || `agent:${agentId}:main`;
      const sessionKey = explicitSessionKey || defaultKey;

      const activeAgent = get().agents.list.find((a) => a.id === agentId);
      set((s) => ({
        agents: {
          ...s.agents,
          activeAgentId: agentId,
        },
        chat: {
          ...s.chat,
          mode: 'direct',
          activeGroupId: null,
          activeSessionKey: sessionKey,
          activeSessionModel: activeAgent?.modelPrimary || null,
          activeSessionModelOverridden: false,
          mainSessionKeys: { ...s.chat.mainSessionKeys, [agentId]: defaultKey },
          loading: true,
          error: null,
        },
      }));

      try {
        await openclawWs.connect();
        await openclawWs.call('sessions.messages.subscribe', { key: sessionKey, agentId }).catch(() => {});
        const historyRes = await openclawWs.call<{ messages?: OpenClawHistoryMsg[] }>('chat.history', {
          sessionKey,
          limit: 100,
        });
        const raw = Array.isArray(historyRes?.messages) ? historyRes.messages : [];
        const messages: ChatMessage[] = raw
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m, i) => ({
            id: m.id || `${sessionKey}-${i}`,
            role: (m.role === 'assistant' ? 'ai' : 'user') as 'user' | 'ai',
            text: extractTextContent(m.content),
            createdAt: m.timestamp,
          }))
          .filter((m) => m.text.length > 0);

        set((s) => ({
          chat: {
            ...s.chat,
            messages,
            toolActivities: extractToolActivities(raw),
            loading: false,
          },
        }));
        get().chat.loadSessions().catch(() => {});
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat sesi OpenClaw';
        set((s) => ({
          chat: { ...s.chat, messages: [], loading: false, error: msg },
        }));
      }
    },

    openGroupChat: async (groupId: string) => {
      stopGroupPoll();
      set((s) => ({
        chat: {
          ...s.chat,
          mode: 'group',
          activeGroupId: groupId,
          loading: true,
          isStreaming: false,
          error: null,
        },
      }));
      try {
        const detail = await getGroup(groupId);
        const messages = mapGroupHistory(groupId, detail?.history || []);
        const pending = Boolean(detail?.pendingTurn?.active);
        set((s) => ({
          chat: {
            ...s.chat,
            messages,
            loading: false,
            isStreaming: pending,
            error: !pending && detail?.pendingTurn?.error ? detail.pendingTurn.error : null,
          },
        }));
        if (pending) {
          scheduleGroupPoll(groupId);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat percakapan grup';
        set((s) => ({
          chat: { ...s.chat, loading: false, isStreaming: false, error: msg },
        }));
      }
    },

    loadSessions: async () => {
      try {
        get().chat.initWsBindings();
        await openclawWs.connect();
        const res = await openclawWs.call<{
          sessions?: Array<{
            key?: string;
            sessionKey?: string;
            updatedAt?: number;
            label?: string;
            displayName?: string;
            model?: string;
            modelProvider?: string;
            modelOverrideSource?: string | null;
          }>;
        }>('sessions.list', { limit: 100 });

        const raw = Array.isArray(res?.sessions) ? res.sessions : [];
        const allParsed: SessionSummary[] = raw
          .map((s) => {
            const key = s.key || s.sessionKey || '';
            const parts = key.split(':');
            const agentId = parts[1] || 'main';
            const title = s.displayName || s.label || extractSessionIdSuffix(key) || key;
            return {
              key,
              agentId,
              title,
              updatedAt: s.updatedAt,
              model: s.model,
              modelProvider: s.modelProvider,
              modelOverrideSource: s.modelOverrideSource,
            };
          })
          .filter((s) => Boolean(s.key));

        const activeKey = get().chat.activeSessionKey;
        const activeMeta = allParsed.find((s) => s.key === activeKey);
        const sessions = allParsed.filter((s) => !isHiddenSystemSessionKey(s.key));

        set((state) => {
          const resolvedModel = activeMeta?.model
            ? activeMeta.modelProvider
              ? `${activeMeta.modelProvider}/${activeMeta.model}`
              : activeMeta.model
            : state.chat.activeSessionModel;
          const overridden = activeMeta ? activeMeta.modelOverrideSource === 'user' : state.chat.activeSessionModelOverridden;
          return {
            chat: {
              ...state.chat,
              sessions,
              activeSessionModel: resolvedModel,
              activeSessionModelOverridden: overridden,
            },
          };
        });
      } catch {}
    },

    newDirectSession: async () => {
      const agentId = get().agents.activeAgentId || 'main';
      const newKey = `agent:${agentId}:chat-${Date.now()}`;
      set((state) => ({
        chat: {
          ...state.chat,
          mode: 'direct',
          activeGroupId: null,
          activeSessionKey: newKey,
          messages: [],
          toolActivities: [],
        },
      }));
      await openclawWs.call('sessions.create', { key: newKey, agentId }).catch(() => {});
      await get().chat.openDirectChat(agentId, newKey);
      get().chat.loadSessions().catch(() => {});
    },

    setSessionModel: async (modelRef: string | null) => {
      const state = get();
      const sessionKey = state.chat.activeSessionKey;
      const agentId = state.agents.activeAgentId || 'main';
      set((s) => ({
        chat: { ...s.chat, switchingModel: true, error: null },
      }));
      try {
        await openclawWs.connect();
        let patchRes: {
          resolved?: { modelProvider?: string; model?: string };
          entry?: { modelOverrideSource?: string };
        };
        try {
          patchRes = await openclawWs.call('sessions.patch', {
            key: sessionKey,
            model: modelRef,
          });
        } catch {
          await openclawWs.call('sessions.create', { key: sessionKey, agentId }).catch(() => {});
          patchRes = await openclawWs.call('sessions.patch', {
            key: sessionKey,
            model: modelRef,
          });
        }

        const prov = patchRes?.resolved?.modelProvider;
        const mod = patchRes?.resolved?.model;
        const nextModel = mod ? (prov ? `${prov}/${mod}` : mod) : modelRef;
        const overridden =
          modelRef !== null && (patchRes?.entry?.modelOverrideSource === 'user' || Boolean(modelRef));

        set((s) => ({
          chat: {
            ...s.chat,
            switchingModel: false,
            activeSessionModel: nextModel,
            activeSessionModelOverridden: overridden,
          },
        }));
        get().chat.loadSessions().catch(() => {});
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal mengubah model sesi';
        set((s) => ({
          chat: { ...s.chat, switchingModel: false, error: msg },
        }));
        throw err;
      }
    },

    sendMessage: async (text, groupSpeaker) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const state = get();
      const replyTo = state.chat.replyTo;
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
        createdAt: Date.now(),
        ...(replyTo ? { replyTo } : {}),
      };

      const outboundText = replyTo ? `[Membalas ${replyTo.author}: "${replyTo.text}"]\n${trimmed}` : trimmed;

      set((s) => ({
        chat: {
          ...s.chat,
          messages: [...s.chat.messages, userMsg],
          replyTo: null,
          isStreaming: true,
          error: null,
        },
      }));

      if (state.chat.mode === 'group' && state.chat.activeGroupId) {
        const groupId = state.chat.activeGroupId;
        const group = state.groups.list.find((g) => g.id === groupId);
        const speaker = groupSpeaker || group?.members?.[0] || 'main';
        try {
          const res = await postGroupMessage(groupId, outboundText, speaker);
          if (res.reply !== undefined) {
            set((s) => ({
              chat: {
                ...s.chat,
                isStreaming: false,
                messages: [
                  ...s.chat.messages,
                  {
                    id: `grp-ai-${Date.now()}`,
                    role: 'ai',
                    author: res.speaker,
                    text: res.reply as string,
                    createdAt: Date.now(),
                  },
                ],
              },
            }));
          } else {
            scheduleGroupPoll(groupId);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Gagal mengirim pesan grup';
          set((s) => ({
            chat: { ...s.chat, isStreaming: false, error: msg },
          }));
        }
        return;
      }

      const agentId = state.agents.activeAgentId || 'main';
      const defaultKey = agentId === 'main' ? MAIN_CHAT_SESSION_KEY : `agent:${agentId}:main`;
      const sessionKey = state.chat.activeSessionKey || defaultKey;
      try {
        await openclawWs.connect();
        await openclawWs.call('sessions.messages.subscribe', { key: sessionKey, agentId }).catch(() => {});
        const sendRes = await openclawWs.call<{ runId?: string }>('chat.send', {
          sessionKey,
          agentId,
          message: outboundText,
          idempotencyKey: makeUuid(),
        });
        set((s) => ({
          chat: {
            ...s.chat,
            activeRunId: sendRes?.runId || null,
          },
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal mengirim pesan ke OpenClaw';
        set((s) => ({
          chat: { ...s.chat, isStreaming: false, error: msg },
        }));
      }
    },

    abortGeneration: async () => {
      const { activeSessionKey, activeRunId } = get().chat;
      try {
        await openclawWs.call('chat.abort', {
          sessionKey: activeSessionKey,
          ...(activeRunId ? { runId: activeRunId } : {}),
        });
      } catch {}
      set((s) => ({
        chat: { ...s.chat, isStreaming: false, activeRunId: null, wsStatus: 'connected' },
      }));
    },
  },
  };
};
