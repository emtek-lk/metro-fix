import { io, Socket } from 'socket.io-client';
import { ServiceRequest } from '@metro-fix/core-types';

type JobEvent = 'job.created' | 'job.updated';
type EventCallback = (data: ServiceRequest) => void;

/**
 * Real-time job feed. The API gateway speaks socket.io and requires a JWT in the
 * handshake (`auth.token`); staff get every job event, customers only their own.
 */
export class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<JobEvent, Set<EventCallback>> = new Map();
  private reconnectListeners: Set<() => void> = new Set();
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.listeners.set('job.created', new Set());
    this.listeners.set('job.updated', new Set());
  }

  connect(token?: string | null): void {
    this.socket?.disconnect();

    this.socket = io(this.baseUrl, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => console.log('[WebSocket] Connected'));
    this.socket.on('disconnect', () => console.log('[WebSocket] Disconnected'));
    this.socket.on('connect_error', (error) => console.warn('[WebSocket] Connection error:', error.message));
    // Events sent while the socket was down are lost, so screens refetch when it comes back.
    this.socket.io.on('reconnect', () => this.reconnectListeners.forEach((cb) => cb()));
    this.socket.on('job.created', (job: ServiceRequest) => this.emit('job.created', job));
    this.socket.on('job.updated', (job: ServiceRequest) => this.emit('job.updated', job));
  }

  on(event: JobEvent, callback: EventCallback): () => void {
    this.listeners.get(event)?.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  onReconnect(callback: () => void): () => void {
    this.reconnectListeners.add(callback);
    return () => {
      this.reconnectListeners.delete(callback);
    };
  }

  private emit(event: JobEvent, data: ServiceRequest): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
