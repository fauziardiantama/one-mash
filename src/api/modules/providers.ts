import { apiRequest } from '../httpClient';

export type AkashApiKeyStatus = 'dead' | 'idle' | 'active';

export interface AkashApiKeyRecord {
  id: string;
  email: string;
  status: AkashApiKeyStatus;
  lastError?: string | null;
  createdAt?: number;
}

export interface ProviderOperationState {
  state: 'idle' | 'running' | 'failed';
  action?: string | null;
  phase?: string | null;
  startedAt?: number | null;
  updatedAt?: number | null;
  error?: string | null;
}

export interface AkashStatus {
  deployed?: boolean;
  active?: boolean;
  state?: string;
  dseq?: string | null;
  url?: string | null;
  endpoints?: string[];
  modelName?: string;
  activeKey?: { id: string; email: string; balanceUsd?: number | null } | null;
  operation?: ProviderOperationState;
  [key: string]: unknown;
}

export interface ModalStatus {
  deployed?: boolean;
  active?: boolean;
  state?: string;
  url?: string | null;
  modelName?: string;
  operation?: ProviderOperationState;
  [key: string]: unknown;
}

export async function getAkashStatus(): Promise<AkashStatus> {
  const status = await apiRequest<AkashStatus>('/provider/akash');
  return {
    ...status,
    url: status.url ?? status.endpoints?.[0] ?? null,
  };
}

export function deployAkash(name?: string, maxWaitSec?: number): Promise<unknown> {
  return apiRequest('/provider/akash/deploy?async=1', {
    method: 'POST',
    body: { name, maxWaitSec, async: true },
    timeoutMs: 15_000,
  });
}

export function stopAkash(dseq?: string): Promise<unknown> {
  return apiRequest('/provider/akash/stop?async=1', {
    method: 'POST',
    body: { ...(dseq ? { dseq } : {}), async: true },
    timeoutMs: 15_000,
  });
}

export function listAkashKeys(): Promise<{ keys: AkashApiKeyRecord[] } | AkashApiKeyRecord[]> {
  return apiRequest('/provider/akash/apikeys');
}

export function addAkashKey(
  email: string,
  key: string,
  status?: AkashApiKeyStatus,
): Promise<unknown> {
  return apiRequest('/provider/akash/apikeys', {
    method: 'POST',
    body: { email, key, status },
  });
}

export function updateAkashKey(
  id: string,
  patch: { email?: string; key?: string; status?: AkashApiKeyStatus },
): Promise<unknown> {
  return apiRequest(`/provider/akash/apikeys/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: patch,
  });
}

export function rotateAkashKey(deadKeyId?: string): Promise<unknown> {
  return apiRequest('/provider/akash/apikeys/rotate', {
    method: 'POST',
    body: deadKeyId ? { deadKeyId } : {},
  });
}

export function deleteAkashKey(identifier: string): Promise<unknown> {
  return apiRequest(`/provider/akash/apikeys/${encodeURIComponent(identifier)}`, {
    method: 'DELETE',
  });
}

export function getAkashYaml(): Promise<{ content?: string; yaml?: string }> {
  return apiRequest('/provider/akash/yaml');
}

export function saveAkashYaml(content: string): Promise<unknown> {
  return apiRequest('/provider/akash/yaml', {
    method: 'PUT',
    body: { content },
  });
}

export function getModalStatus(): Promise<ModalStatus> {
  return apiRequest<ModalStatus>('/provider/modal');
}

export function deployModal(): Promise<unknown> {
  return apiRequest('/provider/modal/deploy?async=1', {
    method: 'POST',
    body: { async: true },
    timeoutMs: 15_000,
  });
}

export function activateModal(): Promise<unknown> {
  return apiRequest('/provider/modal/activate?async=1', {
    method: 'POST',
    body: { async: true },
    timeoutMs: 15_000,
  });
}

export function deactivateModal(): Promise<unknown> {
  return apiRequest('/provider/modal/deactivate?async=1', {
    method: 'POST',
    body: { async: true },
    timeoutMs: 15_000,
  });
}

export function undeployModal(): Promise<unknown> {
  return apiRequest('/provider/modal/undeploy?async=1', {
    method: 'POST',
    body: { async: true },
    timeoutMs: 15_000,
  });
}
