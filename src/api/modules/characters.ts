import { apiRequest, apiUploadMultipart } from '../httpClient';

export interface ImportedCharacterRecord {
  agentId: string;
  characterName: string;
  cardSha256?: string;
  spec?: string;
  creator?: string | null;
  characterVersion?: string | null;
  hasProfilePic?: boolean;
  profilePicUrl?: string | null;
  createdAt?: number;
  avatarUrl?: string;
  description?: string;
  personality?: string;
  firstMes?: string;
}

export interface ParsedCardPreview {
  name: string;
  agentId?: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
  system_prompt?: string;
  creator?: string;
  characterVersion?: string;
  hasEmbeddedAvatar?: boolean;
  hasEmbeddedImage?: boolean;
  spec?: string;
  specVersion?: string;
  duplicate?: {
    isDuplicate?: boolean;
    reason?: string;
    existingAgentId?: string;
  };
  card?: {
    data?: {
      name?: string;
      description?: string;
      personality?: string;
      scenario?: string;
      first_mes?: string;
      system_prompt?: string;
      creator?: string;
      character_version?: string;
    };
  };
  [key: string]: unknown;
}

export function listCharacters(): Promise<{ characters: ImportedCharacterRecord[] }> {
  return apiRequest<{ characters: ImportedCharacterRecord[] }>('/characters');
}

export function getCharacter(agentId: string): Promise<ImportedCharacterRecord> {
  return apiRequest<ImportedCharacterRecord>(`/characters/${encodeURIComponent(agentId)}`);
}

export function deleteCharacter(agentId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/characters/${encodeURIComponent(agentId)}`, {
    method: 'DELETE',
  });
}

function makeCardFormData(file: { uri: string; name?: string; mimeType?: string }): FormData {
  const isJson = Boolean(file.name?.toLowerCase().endsWith('.json')) || file.mimeType === 'application/json';
  const fd = new FormData();
  fd.append('file', {
    uri: file.uri,
    name: file.name || (isJson ? 'character.json' : 'character.png'),
    type: isJson ? 'application/json' : file.mimeType || 'image/png',
  } as unknown as Blob);
  return fd;
}

export async function parseCharacterCard(file: {
  uri: string;
  name?: string;
  mimeType?: string;
}): Promise<ParsedCardPreview> {
  const raw = await apiUploadMultipart<ParsedCardPreview>('/characters/parse', makeCardFormData(file));
  const data = raw?.card?.data;
  return {
    ...raw,
    name: raw.name || data?.name || raw.agentId || 'Karakter Baru',
    description: raw.description ?? data?.description,
    personality: raw.personality ?? data?.personality,
    scenario: raw.scenario ?? data?.scenario,
    first_mes: raw.first_mes ?? data?.first_mes,
    system_prompt: raw.system_prompt ?? data?.system_prompt,
    creator: raw.creator ?? data?.creator,
    characterVersion: raw.characterVersion ?? data?.character_version,
    hasEmbeddedAvatar: raw.hasEmbeddedAvatar ?? raw.hasEmbeddedImage,
  };
}

export function importCharacterCard(file: {
  uri: string;
  name?: string;
  mimeType?: string;
}): Promise<{ character: ImportedCharacterRecord; agentId: string }> {
  return apiUploadMultipart('/characters/import', makeCardFormData(file));
}

export function importCharacterJson(cardJson: Record<string, unknown>): Promise<{
  character: ImportedCharacterRecord;
  agentId: string;
}> {
  return apiRequest('/characters/import', {
    method: 'POST',
    body: cardJson,
  });
}
