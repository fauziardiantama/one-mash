import { apiRequest } from '../httpClient';

export type AkashApiKeyStatus = 'dead' | 'idle' | 'active';

export interface AkashApiKeyRecord {
  id: string;
  email: string;
  status: AkashApiKeyStatus;
  lastError?: string | null;
  createdAt?: number;
}

export interface AkashStatus {
  deployed?: boolean;
  dseq?: string | null;
  url?: string | null;
  modelName?: string;
  activeKey?: { id: string; email: string; balanceUsd?: number | null } | null;
  [key: string]: unknown;
}

export interface ModalStatus {
  deployed?: boolean;
  active?: boolean;
  url?: string | null;
  modelName?: string;
  [key: string]: unknown;
}

export function getAkashStatus(): Promise<AkashStatus> {
  return apiRequest<AkashStatus>('/provider/akash');
}

export function deployAkash(name?: string, maxWaitSec?: number): Promise<unknown> {
  return apiRequest('/provider/akash/deploy', {
    method: 'POST',
    body: { name, maxWaitSec },
    timeoutMs: 120_000,
  });
}

export function stopAkash(dseq?: string): Promise<unknown> {
  return apiRequest('/provider/akash/stop', {
    method: 'POST',
    body: dseq ? { dseq } : {},
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
  return apiRequest('/provider/modal/deploy', { method: 'POST', timeoutMs: 120_000 });
}

export function activateModal(): Promise<unknown> {
  return apiRequest('/provider/modal/activate', { method: 'POST', timeoutMs: 600_000 });
}

export function deactivateModal(): Promise<unknown> {
  return apiRequest('/provider/modal/deactivate', { method: 'POST' });
}

export function undeployModal(): Promise<unknown> {
  return apiRequest('/provider/modal/undeploy', { method: 'POST' });
}
