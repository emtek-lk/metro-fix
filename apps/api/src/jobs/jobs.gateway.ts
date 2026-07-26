import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { ServiceRequestEntity } from '../entities';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class JobsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: any;

  afterInit() {
    console.log('[JobsGateway] Real-time WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`[JobsGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[JobsGateway] Client disconnected: ${client.id}`);
  }

  /**
   * Broadcasts job.created event to Web UI Kanban & Mobile clients
   */
  emitJobCreated(job: ServiceRequestEntity) {
    if (this.server && typeof this.server.emit === 'function') {
      this.server.emit('job.created', job);
    }
  }

  /**
   * Broadcasts job.updated event to Web UI Kanban & Mobile tracking clients
   */
  emitJobUpdated(job: ServiceRequestEntity) {
    if (this.server && typeof this.server.emit === 'function') {
      this.server.emit('job.updated', job);
    }
  }
}
