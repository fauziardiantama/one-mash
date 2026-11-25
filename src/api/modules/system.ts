import { apiRequest } from '../httpClient';

export interface HealthResponse {
  ok: boolean;
  service?: string;
  uptimeSec?: number;
}

export interface OpenClawBootstrapStatus {
  configured: boolean;
  gatewayConnected?: boolean;
  mainAgentExists?: boolean;
  mainAgentConfigured?: boolean;
  details?: {
    litellmProviderExists?: boolean;
    hasAkashModel?: boolean;
    hasModalModel?: boolean;
    mainAgentExists?: boolean;
    mainAgentConfigured?: boolean;
    [key: string]: unknown;
  };
}

export interface OpenClawBootstrapResult {
  action: 'configured' | 'noop' | string;
  configured: boolean;
  message?: string;
}

export function checkHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health', { timeoutMs: 8_000 });
}

export function getOpenClawBootstrapStatus(): Promise<OpenClawBootstrapStatus> {
  return apiRequest<OpenClawBootstrapStatus>('/bootstrap/openclaw');
}

export function runOpenClawBootstrap(force = false): Promise<OpenClawBootstrapResult> {
  return apiRequest<OpenClawBootstrapResult>('/bootstrap/openclaw', {
    method: 'POST',
    body: { force },
    timeoutMs: 30_000,
  });
}
