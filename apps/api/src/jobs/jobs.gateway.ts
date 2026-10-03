import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { Role } from '@metro-fix/core-types';
import { ServiceRequestEntity } from '../entities';

const STAFF_ROOM = 'staff';
const customerRoom = (userId: string) => `customer:${userId}`;
const workerRoom = (userId: string) => `worker:${userId}`;

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class JobsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: any;

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    console.log('[JobsGateway] Real-time WebSocket Gateway initialized');
  }

  /**
   * Clients must present a JWT (socket.io `auth.token`). Dispatch staff join the shared staff room,
   * customers only receive events for their own requests, and workers only receive events for jobs
   * that are offered or assigned to them.
   */
  handleConnection(client: Socket) {
    const token = client.handshake?.auth?.token as string | undefined;
    try {
      if (!token) throw new Error('missing token');
      const payload = this.jwtService.verify<{ sub: string; role: Role }>(token);
      if (payload.role === Role.CUSTOMER) {
        client.join(customerRoom(payload.sub));
      } else if (payload.role === Role.WORKER) {
        client.join(workerRoom(payload.sub));
      } else {
        client.join(STAFF_ROOM);
      }
      console.log(`[JobsGateway] Client connected: ${client.id} (${payload.role})`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[JobsGateway] Client disconnected: ${client.id}`);
  }

  /**
   * Sends an event to dispatch staff, the owning customer and the worker the job is with.
   * `alsoNotifyUserIds` reaches workers who just lost the job (declined, expired, withdrawn) so
   * their screens drop it.
   */
  private broadcast(event: string, job: ServiceRequestEntity, alsoNotifyUserIds: string[] = []) {
    if (!this.server || typeof this.server.to !== 'function') {
      return;
    }
    let target = this.server.to(STAFF_ROOM);
    const ownerUserId = job.customer?.userId;
    if (ownerUserId) {
      target = target.to(customerRoom(ownerUserId));
    }
    const workerUserIds = new Set<string>(alsoNotifyUserIds);
    if (job.worker?.userId) {
      workerUserIds.add(job.worker.userId);
    }
    workerUserIds.forEach((userId) => {
      target = target.to(workerRoom(userId));
    });
    target.emit(event, job);
  }

  /** Broadcasts job.created to the dispatch board and the owning customer. */
  emitJobCreated(job: ServiceRequestEntity) {
    this.broadcast('job.created', job);
  }

  /** Broadcasts job.updated to the dispatch board, the owning customer and the worker involved. */
  emitJobUpdated(job: ServiceRequestEntity, alsoNotifyUserIds: string[] = []) {
    this.broadcast('job.updated', job, alsoNotifyUserIds);
  }

  /** Tells one worker a job has just been offered to them, so their app can raise the alert. */
  emitJobOffered(job: ServiceRequestEntity) {
    const userId = job.worker?.userId;
    if (!userId || !this.server || typeof this.server.to !== 'function') {
      return;
    }
    this.server.to(workerRoom(userId)).emit('job.offered', job);
  }
}
