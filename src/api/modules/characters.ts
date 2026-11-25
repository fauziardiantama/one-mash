import { apiRequest, apiUploadMultipart } from '../httpClient';

export interface ImportedCharacterRecord {
  agentId: string;
  characterName: string;
  cardSha256?: string;
  createdAt?: number;
  avatarUrl?: string;
  description?: string;
  personality?: string;
  firstMes?: string;
}

export interface ParsedCardPreview {
  name: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
  system_prompt?: string;
  hasEmbeddedAvatar?: boolean;
  spec?: string;
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
  const fd = new FormData();
  fd.append('file', {
    uri: file.uri,
    name: file.name || 'character.png',
    type: file.mimeType || 'image/png',
  } as unknown as Blob);
  return fd;
}

export function parseCharacterCard(file: {
  uri: string;
  name?: string;
  mimeType?: string;
}): Promise<ParsedCardPreview> {
  return apiUploadMultipart<ParsedCardPreview>('/characters/parse', makeCardFormData(file));
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
