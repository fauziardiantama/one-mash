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

export interface GroupDetailRecord extends GroupRecord {
  mode?: string;
  history?: GroupMessageItem[];
}

export function getGroup(id: string): Promise<GroupDetailRecord> {
  return apiRequest<GroupDetailRecord>(`/groups/${encodeURIComponent(id)}`);
}

export function postGroupMessage(
  id: string,
  text: string,
  speaker: string,
): Promise<{ speaker: string; reply: string }> {
  return apiRequest(`/groups/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    body: { text, speaker },
    timeoutMs: 90_000,
  });
}
