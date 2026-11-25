import { getApiBaseUrl, toWsBaseUrl } from './httpClient';

export type WsConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'streaming';

export interface OpenClawChatEvent {
  runId?: string;
  sessionKey?: string;
  state?: 'delta' | 'final' | 'error' | 'aborted';
  message?: {
    role?: string;
    content?: Array<{ type?: string; text?: string; name?: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  errorMessage?: string;
  [key: string]: unknown;
}

export interface OpenClawWsListeners {
  onStatusChange?: (status: WsConnectionStatus) => void;
  onChatEvent?: (payload: OpenClawChatEvent) => void;
  onRawEvent?: (event: string, payload: unknown) => void;
  onError?: (message: string) => void;
}

interface PendingRpc {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const CONNECT_REQ_ID = 'onemash-connect';

/**
 * Isolated WebSocket RPC manager for OpenClaw Gateway proxied at /openclaw.
 * No OpenClaw auth token is handled on the client — backend injects credentials.
 */
class OpenClawWsClient {
  private socket: WebSocket | null = null;
  private status: WsConnectionStatus = 'disconnected';
  private listeners: OpenClawWsListeners = {};
  private pending = new Map<string, PendingRpc>();
  private reqSeq = 0;
  private connectSent = false;
  private manualClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readyPromise: Promise<void> | null = null;
  private resolveReady: (() => void) | null = null;
  private rejectReady: ((err: Error) => void) | null = null;

  setListeners(listeners: OpenClawWsListeners): void {
    this.listeners = listeners;
  }

  getStatus(): WsConnectionStatus {
    return this.status;
  }

  private updateStatus(next: WsConnectionStatus): void {
    this.status = next;
    this.listeners.onStatusChange?.(next);
  }

  connect(): Promise<void> {
    if (
      this.socket &&
      (this.status === 'connected' || this.status === 'connecting') &&
      this.readyPromise
    ) {
      return this.readyPromise;
    }

    this.manualClose = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.closeSocketOnly();

    const wsUrl = `${toWsBaseUrl(getApiBaseUrl())}/openclaw`;
    this.connectSent = false;
    this.updateStatus('connecting');

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });

    const ws = new WebSocket(wsUrl);
    this.socket = ws;

    const sendConnectFrame = () => {
      if (this.socket !== ws || this.connectSent) return;
      if (ws.readyState !== WebSocket.OPEN) return;
      this.connectSent = true;
      ws.send(
        JSON.stringify({
          type: 'req',
          id: CONNECT_REQ_ID,
          method: 'connect',
          params: {
            minProtocol: 4,
            maxProtocol: 4,
            client: {
              id: 'gateway-client',
              version: '1.0.0',
              platform: 'android',
              mode: 'backend',
            },
            role: 'operator',
            scopes: ['operator.admin', 'operator.read', 'operator.write'],
            caps: ['chat-only-assistant-text'],
          },
        }),
      );
    };

    const fallbackTimer = setTimeout(sendConnectFrame, 1500);

    ws.onopen = () => {
      if (this.socket !== ws) return;
      // Wait briefly for connect.challenge; fallbackTimer sends connect if none arrives.
    };

    ws.onmessage = (event) => {
      if (this.socket !== ws) return;
      let frame: Record<string, unknown>;
      try {
        frame = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (frame.type === 'event' && frame.event === 'connect.challenge') {
        clearTimeout(fallbackTimer);
        sendConnectFrame();
        return;
      }

      if (frame.type === 'res' && frame.id === CONNECT_REQ_ID) {
        clearTimeout(fallbackTimer);
        if (frame.ok === true) {
          this.updateStatus('connected');
          this.resolveReady?.();
          this.resolveReady = null;
          this.rejectReady = null;
        } else {
          const errObj = frame.error as Record<string, unknown> | undefined;
          const msg =
            typeof errObj?.message === 'string' ? errObj.message : 'OpenClaw connect handshake failed';
          this.updateStatus('disconnected');
          this.listeners.onError?.(msg);
          this.rejectReady?.(new Error(msg));
          this.resolveReady = null;
          this.rejectReady = null;
        }
        return;
      }

      if (frame.type === 'res' && typeof frame.id === 'string' && this.pending.has(frame.id)) {
        const entry = this.pending.get(frame.id);
        this.pending.delete(frame.id);
        if (!entry) return;
        clearTimeout(entry.timer);
        if (frame.ok === true) {
          entry.resolve(frame.payload);
        } else {
          const errObj = frame.error as Record<string, unknown> | undefined;
          const msg = typeof errObj?.message === 'string' ? errObj.message : 'OpenClaw RPC failed';
          entry.reject(new Error(msg));
        }
        return;
      }

      if (frame.type === 'event' && typeof frame.event === 'string') {
        if (frame.event === 'chat') {
          this.listeners.onChatEvent?.((frame.payload ?? {}) as OpenClawChatEvent);
        } else {
          this.listeners.onRawEvent?.(frame.event, frame.payload);
        }
      }
    };

    ws.onerror = () => {
      if (this.socket !== ws) return;
      clearTimeout(fallbackTimer);
      this.listeners.onError?.('WebSocket OpenClaw terputus');
    };

    ws.onclose = () => {
      if (this.socket !== ws) return;
      clearTimeout(fallbackTimer);
      this.updateStatus('disconnected');
      this.rejectReady?.(new Error('Koneksi OpenClaw ditutup sebelum siap'));
      this.resolveReady = null;
      this.rejectReady = null;
      this.clearPending('Koneksi WebSocket ditutup');

      if (!this.manualClose) {
        this.reconnectTimer = setTimeout(() => {
          this.connect().catch(() => {});
        }, 3500);
      }
    };

    return this.readyPromise;
  }

  async call<T = unknown>(method: string, params: Record<string, unknown> = {}, timeoutMs = 30_000): Promise<T> {
    if (!this.socket || this.status === 'disconnected' || this.status === 'connecting') {
      await this.connect();
    }

    return new Promise<T>((resolve, reject) => {
      const ws = this.socket;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket OpenClaw belum terhubung'));
        return;
      }

      const id = `onemash-rpc-${++this.reqSeq}`;
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`RPC ${method} timeout`));
        }
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (v) => resolve(v as T),
        reject,
        timer,
      });

      ws.send(JSON.stringify({ type: 'req', id, method, params }));
    });
  }

  disconnect(): void {
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.closeSocketOnly();
    this.updateStatus('disconnected');
  }

  private clearPending(reason: string): void {
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason));
    }
    this.pending.clear();
  }

  private closeSocketOnly(): void {
    if (this.socket) {
      const old = this.socket;
      this.socket = null;
      old.onopen = null;
      old.onmessage = null;
      old.onerror = null;
      old.onclose = null;
      try {
        old.close();
      } catch {}
    }
  }
}

export const openclawWs = new OpenClawWsClient();
