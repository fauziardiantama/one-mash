import type {
  AkashApiKeyRecord,
  AkashStatus,
  GroupRecord,
  ImportedCharacterRecord,
  ModalStatus,
  NotificationConfigState,
  NotificationRecord,
  OpenClawBootstrapStatus,
  ParsedCardPreview,
  ProfilePicMeta,
  WsConnectionStatus,
} from '../api';

export interface ReplyTarget {
  author: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  author?: string;
  text: string;
  createdAt?: string | number;
  replyTo?: ReplyTarget;
  streaming?: boolean;
}

export interface ToolActivityItem {
  id: string;
  toolName: string;
  title: string;
  subtitle: string;
  time: string;
  rawDate: Date;
  hasAlertDot?: boolean;
  detail: string;
  stepDesc: string;
  statusLabel: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  ref: string;
  tags?: string[];
}

export interface AgentSummary {
  id: string;
  name: string;
  isCharacter?: boolean;
  description?: string;
  avatarVersion?: string;
  modelPrimary?: string;
  modelFallbacks?: string[];
}

export interface SessionSummary {
  key: string;
  agentId: string;
  title: string;
  updatedAt?: number;
  model?: string;
  modelProvider?: string;
  modelOverrideSource?: string | null;
}

export interface ConnectionSlice {
  connection: {
    baseUrl: string;
    hasConfiguredUrl: boolean;
    connected: boolean;
    bootstrapStatus: OpenClawBootstrapStatus | null;
    loading: boolean;
    bootstrapLoading: boolean;
    error: string | null;
    setBaseUrl: (url: string) => void;
    checkStartupConnection: () => Promise<'chat' | 'connect'>;
    connectToBackend: (url: string) => Promise<boolean>;
    refreshBootstrap: () => Promise<OpenClawBootstrapStatus | null>;
    triggerBootstrap: (force?: boolean) => Promise<void>;
    disconnect: () => void;
    clearError: () => void;
  };
}

export interface AgentsSlice {
  agents: {
    list: AgentSummary[];
    models: ModelOption[];
    characters: ImportedCharacterRecord[];
    profilePics: Record<string, ProfilePicMeta>;
    activeAgentId: string;
    loading: boolean;
    uploading: boolean;
    error: string | null;
    loadAgents: () => Promise<void>;
    loadModels: () => Promise<void>;
    selectAgent: (agentId: string) => void;
    uploadAvatar: (agentId: string, file: { uri: string; name?: string; mimeType?: string }) => Promise<void>;
    removeAvatar: (agentId: string) => Promise<void>;
    parseCard: (file: { uri: string; name?: string; mimeType?: string }) => Promise<ParsedCardPreview>;
    importCard: (file: { uri: string; name?: string; mimeType?: string }) => Promise<string>;
    importCardJson: (json: Record<string, unknown>) => Promise<string>;
    removeCharacter: (agentId: string) => Promise<void>;
  };
}

export interface ChatSlice {
  chat: {
    mode: 'direct' | 'group';
    activeGroupId: string | null;
    activeSessionKey: string;
    activeSessionModel: string | null;
    activeSessionModelOverridden: boolean;
    switchingModel: boolean;
    mainSessionKeys: Record<string, string>;
    sessions: SessionSummary[];
    messages: ChatMessage[];
    toolActivities: ToolActivityItem[];
    replyTo: ReplyTarget | null;
    wsStatus: WsConnectionStatus;
    isStreaming: boolean;
    activeRunId: string | null;
    loading: boolean;
    error: string | null;
    initWsBindings: () => void;
    openDirectChat: (agentId?: string, sessionKey?: string) => Promise<void>;
    openGroupChat: (groupId: string) => Promise<void>;
    loadSessions: () => Promise<void>;
    newDirectSession: () => Promise<void>;
    setSessionModel: (modelRef: string | null) => Promise<void>;
    sendMessage: (text: string, groupSpeaker?: string) => Promise<void>;
    abortGeneration: () => Promise<void>;
    setReplyTo: (target: ReplyTarget | null) => void;
  };
}

export interface ProvidersSlice {
  providers: {
    akash: AkashStatus | null;
    akashKeys: AkashApiKeyRecord[];
    akashYaml: string;
    modal: ModalStatus | null;
    loading: boolean;
    error: string | null;
    loadProviders: () => Promise<void>;
    deployAkash: (name?: string) => Promise<void>;
    stopAkash: () => Promise<void>;
    addAkashKey: (email: string, key: string) => Promise<void>;
    updateAkashKey: (id: string, patch: { email?: string; key?: string; status?: 'dead' | 'idle' | 'active' }) => Promise<void>;
    rotateAkashKey: (deadKeyId?: string) => Promise<void>;
    deleteAkashKey: (identifier: string) => Promise<void>;
    loadAkashYaml: () => Promise<string>;
    saveAkashYaml: (content: string) => Promise<void>;
    deployModal: () => Promise<void>;
    activateModal: () => Promise<void>;
    deactivateModal: () => Promise<void>;
    undeployModal: () => Promise<void>;
  };
}

export interface GroupsSlice {
  groups: {
    list: GroupRecord[];
    loading: boolean;
    error: string | null;
    loadGroups: () => Promise<void>;
    createGroup: (name: string, members: string[]) => Promise<GroupRecord>;
  };
}

export interface NotificationsSlice {
  notifications: {
    list: NotificationRecord[];
    batches: Array<Record<string, unknown>>;
    config: NotificationConfigState;
    loading: boolean;
    error: string | null;
    loadNotifications: () => Promise<void>;
    toggleSleep: (sleep: boolean, flushHeld?: boolean) => Promise<void>;
    flushNow: () => Promise<void>;
    clearAll: () => Promise<void>;
    startRealtime: () => void;
    stopRealtime: () => void;
  };
}

export interface SettingsSlice {
  settings: {
    values: Record<string, unknown>;
    setValue: (key: string, value: unknown) => void;
  };
}

export type AppStore = ConnectionSlice &
  AgentsSlice &
  ChatSlice &
  ProvidersSlice &
  GroupsSlice &
  NotificationsSlice &
  SettingsSlice;
