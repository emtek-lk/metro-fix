import { io, Socket } from 'socket.io-client';
import { ServiceRequest } from '@metro-fix/core-types';

class RealtimeSocket {
  private socket: Socket | null = null;
  // Use 10.0.2.2 for Android emulator if localhost fails, but rely on EXPO_PUBLIC_API_URL
  private url = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
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
