import { apiRequest, apiUploadMultipart, getApiBaseUrl } from '../httpClient';

export interface ProfilePicMeta {
  agentId: string;
  mimeType: string;
  sha256: string;
  sizeBytes?: number;
  updatedAt?: number;
  url?: string;
}

export function listProfilePics(): Promise<{ profilePics: ProfilePicMeta[] }> {
  return apiRequest<{ profilePics: ProfilePicMeta[] }>('/agents/profile-pics');
}

export function getProfilePicMeta(agentId: string): Promise<ProfilePicMeta> {
  return apiRequest<ProfilePicMeta>(`/agents/${encodeURIComponent(agentId)}/profile-pic/meta`);
}

export function buildProfilePicUrl(agentId: string, versionTag?: string): string {
  const base = getApiBaseUrl();
  const q = versionTag ? `?v=${encodeURIComponent(versionTag)}` : '';
  return `${base}/agents/${encodeURIComponent(agentId)}/profile-pic${q}`;
}

export function uploadProfilePic(
  agentId: string,
  file: { uri: string; name?: string; mimeType?: string },
): Promise<ProfilePicMeta> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name || 'avatar.png',
    type: file.mimeType || 'image/png',
  } as unknown as Blob);

  return apiUploadMultipart<ProfilePicMeta>(
    `/agents/${encodeURIComponent(agentId)}/profile-pic`,
    formData,
    'POST',
  );
}

export function deleteProfilePic(agentId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/agents/${encodeURIComponent(agentId)}/profile-pic`, {
    method: 'DELETE',
  });
}
