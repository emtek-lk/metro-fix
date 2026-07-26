import { ServiceRequest } from '@metro-fix/core-types';

type EventCallback = (job: ServiceRequest) => void;

export class RealtimeSocketService {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  constructor() {
    this.listeners.set('job.created', new Set());
    this.listeners.set('job.updated', new Set());
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

  emitLocalUpdate(event: 'job.created' | 'job.updated', job: ServiceRequest): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => cb(job));
    }
  }
}

export const realtimeSocket = new RealtimeSocketService();
