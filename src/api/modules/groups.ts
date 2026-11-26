import { apiRequest } from '../httpClient';

export interface GroupRecord {
  id: string;
  sessionId?: string;
  name: string;
  members: string[];
  createdAt?: number;
}

export function listGroups(): Promise<GroupRecord[] | { groups: GroupRecord[] }> {
  return apiRequest('/groups');
}

export function createGroup(name: string, members: string[]): Promise<GroupRecord> {
  return apiRequest<GroupRecord>('/groups', {
    method: 'POST',
    body: { name, members },
  });
}

export interface GroupMessageItem {
  id?: number | string;
  speaker: string;
  text: string;
  createdAt?: number;
  ts?: number;
}

export interface GroupPendingTurnState {
  active: boolean;
  speaker?: string | null;
  startedAt?: number | null;
  error?: string | null;
}

export interface GroupDetailRecord extends GroupRecord {
  mode?: string;
  history?: GroupMessageItem[];
  pendingTurn?: GroupPendingTurnState;
}

export function getGroup(id: string): Promise<GroupDetailRecord> {
  return apiRequest<GroupDetailRecord>(`/groups/${encodeURIComponent(id)}`);
}

export interface PostGroupMessageResponse {
  accepted?: boolean;
  speaker: string;
  reply?: string;
  pendingTurn?: GroupPendingTurnState;
}

export function postGroupMessage(
  id: string,
  text: string,
  speaker: string,
): Promise<PostGroupMessageResponse> {
  return apiRequest(`/groups/${encodeURIComponent(id)}/messages?async=1`, {
    method: 'POST',
    body: { text, speaker, async: true },
    timeoutMs: 15_000,
  });
}

export function deleteGroup(id: string): Promise<{ deleted: boolean; id: string }> {
  return apiRequest(`/groups/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function abortGroupTurn(id: string): Promise<{ aborted: boolean }> {
  return apiRequest(`/groups/${encodeURIComponent(id)}/abort`, {
    method: 'POST',
  });
}
