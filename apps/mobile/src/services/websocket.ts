import { io, Socket } from 'socket.io-client';
import { ServiceRequest } from '@metro-fix/core-types';
import { API_BASE_URL } from '../lib/api';

class RealtimeSocket {
  private socket: Socket | null = null;
  // Same origin as the REST client (10.0.2.2 on the Android emulator, localhost on iOS).
  private url = API_BASE_URL;
  private listeners: Record<string, Function[]> = {};

  connect(token?: string) {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.socket = io(this.url, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected to backend gateway');
      // Fires on every (re)connect so screens can refetch anything they missed while offline.
      this.emitLocalUpdate('socket.connected', undefined);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[WebSocket] Connection error:', error?.message ?? error);
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from backend gateway');
    });

    // Listen to job updates from backend
    this.socket.on('job.updated', (job: ServiceRequest) => {
      this.emitLocalUpdate('job.updated', job);
    });
    
    this.socket.on('job.created', (job: ServiceRequest) => {
      this.emitLocalUpdate('job.created', job);
    });

    // A job was just offered to this worker.
    this.socket.on('job.offered', (job: ServiceRequest) => {
      this.emitLocalUpdate('job.offered', job);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Local event emitter for the app
  emitLocalUpdate(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }
}

export const realtimeSocket = new RealtimeSocket();
