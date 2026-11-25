import { getApiBaseUrl, toWsBaseUrl } from './httpClient';

export interface NotificationSocketEvent {
  type: string;
  [key: string]: unknown;
}

class NotificationsWsClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manualClose = false;
  private onEventCb: ((ev: NotificationSocketEvent) => void) | null = null;

  start(onEvent: (ev: NotificationSocketEvent) => void): void {
    this.onEventCb = onEvent;
    this.manualClose = false;
    this.connect();
  }

  private connect(): void {
    this.stopSocket();
    const wsUrl = `${toWsBaseUrl(getApiBaseUrl())}/notifications/ws`;
    try {
      const ws = new WebSocket(wsUrl);
      this.socket = ws;

      ws.onmessage = (event) => {
        if (this.socket !== ws) return;
        try {
          const parsed = JSON.parse(String(event.data)) as NotificationSocketEvent;
          this.onEventCb?.(parsed);
        } catch {}
      };

      ws.onclose = () => {
        if (this.socket !== ws) return;
        if (!this.manualClose) {
          this.reconnectTimer = setTimeout(() => this.connect(), 5000);
        }
      };
    } catch {}
  }

  stop(): void {
    this.manualClose = true;
    this.onEventCb = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopSocket();
  }

  private stopSocket(): void {
    if (this.socket) {
      const old = this.socket;
      this.socket = null;
      old.onmessage = null;
      old.onclose = null;
      old.onerror = null;
      try {
        old.close();
      } catch {}
    }
  }
}

export const notificationsWs = new NotificationsWsClient();
