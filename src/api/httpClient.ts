// Centralized HTTP client supporting JSON and multipart/binary uploads.
// Never imported directly by UI screens or components.

export const DEFAULT_BACKEND_URL = 'http://localhost:4001';
const DEFAULT_TIMEOUT_MS = 20_000;

let activeBaseUrl = '';

export function sanitizeBaseUrl(url?: string | null): string {
  return (url ?? '').trim().replace(/\/+$/, '');
}

export function setApiBaseUrl(url?: string | null): void {
  activeBaseUrl = sanitizeBaseUrl(url);
}

export function getApiBaseUrl(): string {
  return activeBaseUrl || DEFAULT_BACKEND_URL;
}

export function toWsBaseUrl(httpUrl?: string | null): string {
  const base = sanitizeBaseUrl(httpUrl) || getApiBaseUrl();
  return base.replace(/^http(s?):\/\//i, (_, s: string) => (s ? 'wss://' : 'ws://'));
}

export interface ApiError extends Error {
  status?: number;
  kind: 'timeout' | 'network' | 'http' | 'conflict';
  payload?: unknown;
}

function makeApiError(
  message: string,
  kind: ApiError['kind'],
  status?: number,
  payload?: unknown,
): ApiError {
  const err = new Error(message) as ApiError;
  err.kind = kind;
  err.status = status;
  err.payload = payload;
  return err;
}

function buildFullUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${base}${normalizedPath}`;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }
  return url;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const url = buildFullUrl(path, query);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const reqHeaders: Record<string, string> = { ...headers };
  let serializedBody: string | undefined;
  if (body !== undefined) {
    reqHeaders['Content-Type'] = 'application/json';
    serializedBody = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: serializedBody,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!res.ok) {
      const msgObj = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
      const errMsg =
        (typeof msgObj?.message === 'string' && msgObj.message) ||
        (typeof msgObj?.error === 'string' && msgObj.error) ||
        `HTTP ${res.status}`;
      throw makeApiError(errMsg, res.status === 409 ? 'conflict' : 'http', res.status, parsed);
    }

    return parsed as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err && typeof err === 'object' && 'kind' in err) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw makeApiError('Koneksi timeout ke backend server', 'timeout');
    }
    const msg = err instanceof Error ? err.message : 'Gagal terhubung ke jaringan';
    throw makeApiError(msg, 'network');
  }
}

export async function apiUploadMultipart<T = unknown>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST',
  timeoutMs = 60_000,
): Promise<T> {
  const url = buildFullUrl(path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (!res.ok) {
      const msgObj = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
      const errMsg =
        (typeof msgObj?.message === 'string' && msgObj.message) ||
        (typeof msgObj?.error === 'string' && msgObj.error) ||
        `HTTP ${res.status}`;
      throw makeApiError(errMsg, res.status === 409 ? 'conflict' : 'http', res.status, parsed);
    }

    return parsed as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err && typeof err === 'object' && 'kind' in err) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw makeApiError('Upload timeout ke backend server', 'timeout');
    }
    const msg = err instanceof Error ? err.message : 'Upload gagal';
    throw makeApiError(msg, 'network');
  }
}
