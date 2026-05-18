import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Injectable()
export class EventsService {
  constructor(private readonly eventsGateway: EventsGateway) {}

  emitToTenant(tenantId: string, event: string, data: any) {
    const room = `tenant-${tenantId}`;
    this.eventsGateway.server.to(room).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: any) {
    this.eventsGateway.server.to(room).emit(event, data);
  }

  emitToTenantModule(
    tenantId: string,
    module: 'orders' | 'kitchen' | 'reservations',
    event: string,
    data: any,
  ) {
    const room = `tenant-${tenantId}-${module}`;
    this.eventsGateway.server.to(room).emit(event, data);
  }
}
