declare module '@nestjs/websockets' {
  export function WebSocketGateway(options?: any): ClassDecorator;
  export function WebSocketServer(): PropertyDecorator;
  export interface OnGatewayInit {
    afterInit(server: any): void;
  }
  export interface OnGatewayConnection {
    handleConnection(client: any, ...args: any[]): void;
  }
  export interface OnGatewayDisconnect {
    handleDisconnect(client: any): void;
  }
}

declare module 'socket.io' {
  export interface Server {
    emit(event: string, ...args: any[]): boolean;
    to(room: string): Server;
  }
  export interface Socket {
    id: string;
    handshake: { auth?: Record<string, unknown> };
    join(room: string): void;
    disconnect(close?: boolean): void;
  }
}
