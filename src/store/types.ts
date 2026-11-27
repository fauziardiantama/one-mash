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

export interface ToolCatalogItem {
  id: string;
  label: string;
  description?: string;
  rawDescription?: string;
  source?: string;
  defaultProfiles?: string[];
}

export interface ToolCatalogGroup {
  id: string;
  label: string;
  source?: string;
  tools: ToolCatalogItem[];
}

export interface ToolProfileOption {
  id: string;
  label: string;
}

export interface AgentEffectiveTools {
  profile: string;
  groups: ToolCatalogGroup[];
  estimated?: boolean;
}

export interface AgentToolsCatalog {
  profiles: ToolProfileOption[];
  groups: ToolCatalogGroup[];
}

export interface AgentSkillItem {
  name: string;
  skillKey?: string;
  description?: string;
  source?: string;
  emoji?: string;
  eligible: boolean;
  disabled: boolean;
  blockedByAllowlist?: boolean;
  missing?: {
    bins?: string[];
    anyBins?: string[];
    env?: string[];
    config?: string[];
    os?: string[];
  };
}

export interface AgentConfigUpdateInput {
  name?: string;
  description?: string | null;
  emoji?: string | null;
  workspace?: string | null;
  modelPrimary?: string | null;
  modelFallbacks?: string[];
  thinkingDefault?: string | null;
  verboseDefault?: string | null;
  reasoningDefault?: string | null;
  typingMode?: string | null;
  subagentsAllow?: string[];
  subagentsDelegationMode?: string | null;
  heartbeatEvery?: string | null;
}

export interface AgentToolsPolicyInput {
  profile?: string | null;
  allow?: string[] | null;
  alsoAllow?: string[] | null;
  deny?: string[] | null;
}

export interface CreateOpenClawAgentInput {
  name: string;
  model?: string;
  workspace?: string;
  emoji?: string;
  avatar?: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  isCharacter?: boolean;
  description?: string;
  emoji?: string;
  avatarVersion?: string;
  modelPrimary?: string;
  modelFallbacks?: string[];
  workspace?: string;
  workspaceGit?: boolean;
  thinkingDefault?: string;
  thinkingOptions?: string[];
  verboseDefault?: string;
  reasoningDefault?: string;
  fastModeDefault?: string | boolean;
  typingMode?: string;
  heartbeatEvery?: string;
  defaultPermissionMode?: string;
  runtimeId?: string;
  createdVia?: string;
  createdAt?: number;
  identityName?: string;
  creator?: string | null;
  characterVersion?: string | null;
}

export interface AgentWorkspaceFile {
  name: string;
  path?: string;
  missing?: boolean;
  size?: number;
  updatedAtMs?: number;
  hash?: string;
  content?: string;
}

export interface AgentDetailData {
  agentId: string;
  summary: AgentSummary;
  toolsProfile?: string;
  toolsAllow: string[] | null;
  toolsAlsoAllow: string[];
  toolsDeny: string[];
  skillsFilter: string[] | null;
  subagentsAllow: string[];
  subagentsDelegationMode?: string;
  heartbeatEvery?: string;
  verboseDefault?: string;
  reasoningDefault?: string;
  fastModeDefault?: string | boolean;
  typingMode?: string;
  effectiveTools: AgentEffectiveTools | null;
  toolsCatalog: AgentToolsCatalog | null;
  skills: AgentSkillItem[];
  sessions: SessionSummary[];
  files: AgentWorkspaceFile[];
  profilePicMeta: ProfilePicMeta | null;
  characterMeta: ImportedCharacterRecord | null;
  loadedAt: number;
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
    details: Record<string, AgentDetailData>;
    activeAgentId: string;
    loading: boolean;
    detailLoading: boolean;
    fileLoading: boolean;
    savingConfig: boolean;
    savingFile: boolean;
    uploading: boolean;
    error: string | null;
    loadAgents: () => Promise<void>;
    loadModels: () => Promise<void>;
    loadAgentDetail: (agentId: string) => Promise<AgentDetailData>;
    loadAgentFile: (agentId: string, fileName: string) => Promise<AgentWorkspaceFile | null>;
    saveAgentFile: (agentId: string, fileName: string, content: string) => Promise<AgentWorkspaceFile | null>;
    createAgent: (input: CreateOpenClawAgentInput) => Promise<string>;
    updateAgentConfig: (agentId: string, patch: AgentConfigUpdateInput) => Promise<void>;
    updateAgentToolsPolicy: (agentId: string, policy: AgentToolsPolicyInput) => Promise<void>;
    updateAgentSkillsFilter: (agentId: string, skillsFilter: string[] | null) => Promise<void>;
    deleteAgent: (agentId: string) => Promise<void>;
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
    activeGroupSpeaker: string | null;
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
    setGroupSpeaker: (agentId: string) => void;
    triggerGroupTurn: (speaker?: string) => Promise<void>;
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
    deleteGroup: (id: string) => Promise<void>;
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
