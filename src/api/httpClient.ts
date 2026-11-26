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

function parseResponseText(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractHttpErrorMessage(parsed: unknown, status: number): string {
  const msgObj = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  return (
    (typeof msgObj?.message === 'string' && msgObj.message) ||
    (typeof msgObj?.error === 'string' && msgObj.error) ||
    `HTTP ${status}`
  );
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

    const parsed = parseResponseText(await res.text());

    if (!res.ok) {
      const errMsg = extractHttpErrorMessage(parsed, res.status);
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

export function apiUploadMultipart<T = unknown>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST',
  timeoutMs = 60_000,
): Promise<T> {
  const url = buildFullUrl(path);

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    const finishError = (err: ApiError) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    };

    const timer = setTimeout(() => {
      xhr.abort();
      finishError(makeApiError('Upload timeout ke backend server', 'timeout'));
    }, timeoutMs);

    xhr.open(method, url);
    xhr.timeout = timeoutMs;

    xhr.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (xhr.status === 0) {
        reject(makeApiError('Gagal terhubung ke backend saat mengunggah', 'network'));
        return;
      }

      const parsed = parseResponseText(xhr.responseText ?? '');
      if (xhr.status < 200 || xhr.status >= 300) {
        const errMsg = extractHttpErrorMessage(parsed, xhr.status);
        reject(
          makeApiError(
            errMsg,
            xhr.status === 409 ? 'conflict' : 'http',
            xhr.status,
            parsed,
          ),
        );
        return;
      }

      resolve(parsed as T);
    };

    xhr.onerror = () => {
      finishError(makeApiError('Gagal mengunggah berkas ke server', 'network'));
    };

    xhr.ontimeout = () => {
      finishError(makeApiError('Upload timeout ke backend server', 'timeout'));
    };

    xhr.onabort = () => {
      finishError(makeApiError('Upload dibatalkan atau timeout', 'timeout'));
    };

    try {
      // Pakai native XMLHttpRequest agar part FormData `{ uri, name, type }` diproses
      // langsung oleh RCTNetworking/OkHttp, bukan `expo/fetch` yang menolak RN FormDataPart.
      xhr.send(formData as unknown as XMLHttpRequestBodyInit);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload gagal';
      finishError(makeApiError(msg, 'network'));
    }
  });
}
