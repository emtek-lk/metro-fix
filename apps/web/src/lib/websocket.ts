import { ServiceRequest } from '@metro-fix/core-types';

type EventCallback = (data: ServiceRequest) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.listeners.set('job.created', new Set());
    this.listeners.set('job.updated', new Set());
  }

  connect(): void {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws');
    console.log('[WebSocket] Connecting to', wsUrl);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.event === 'job.created' || message.event === 'job.updated') {
            this.emit(message.event, message.data);
          }
        } catch (e) {
          console.warn('[WebSocket] Failed to parse message:', e);
        }
      };

      this.socket.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      this.socket.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[WebSocket] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.warn('[WebSocket] Max reconnection attempts reached');
    }
  }

  on(event: 'job.created' | 'job.updated', callback: EventCallback): () => void {
    const set = this.listeners.get(event);
    if (set) {
      set.add(callback);
    }
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: ServiceRequest): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => cb(data));
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
