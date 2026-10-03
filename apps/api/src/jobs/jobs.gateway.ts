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
   * Clients must present a JWT (socket.io `auth.token`). Staff and workers join the shared
   * staff room; customers only receive events for their own requests.
   */
  handleConnection(client: Socket) {
    const token = client.handshake?.auth?.token as string | undefined;
    try {
      if (!token) throw new Error('missing token');
      const payload = this.jwtService.verify<{ sub: string; role: Role }>(token);
      if (payload.role === Role.CUSTOMER) {
        client.join(customerRoom(payload.sub));
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

  private broadcast(event: string, job: ServiceRequestEntity) {
    if (!this.server || typeof this.server.to !== 'function') {
      return;
    }
    let target = this.server.to(STAFF_ROOM);
    const ownerUserId = job.customer?.userId;
    if (ownerUserId) {
      target = target.to(customerRoom(ownerUserId));
    }
    target.emit(event, job);
  }

  /** Broadcasts job.created to the dispatch board, workers, and the owning customer. */
  emitJobCreated(job: ServiceRequestEntity) {
    this.broadcast('job.created', job);
  }

  /** Broadcasts job.updated to the dispatch board, workers, and the owning customer. */
  emitJobUpdated(job: ServiceRequestEntity) {
    this.broadcast('job.updated', job);
  }
}
