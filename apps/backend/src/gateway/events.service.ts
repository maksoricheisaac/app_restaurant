import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

// Champs sensibles à ne jamais émettre via WebSocket
const SENSITIVE_FIELDS = new Set([
  'password',
  'tokenHash',
  'emailVerificationToken',
  'passwordResetToken',
  'paymentCustomerId',
  'paymentSubscriptionId',
  'ipAddress',
]);

function sanitizePayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizePayload);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key)) continue;
    result[key] = sanitizePayload(value);
  }
  return result;
}

@Injectable()
export class EventsService {
  constructor(private readonly eventsGateway: EventsGateway) {}

  emitToTenant(tenantId: string, event: string, data: unknown) {
    const room = `tenant-${tenantId}`;
    this.eventsGateway.server.to(room).emit(event, sanitizePayload(data));
  }

  emitToRoom(room: string, event: string, data: unknown) {
    this.eventsGateway.server.to(room).emit(event, sanitizePayload(data));
  }

  emitToTenantModule(
    tenantId: string,
    module: 'orders' | 'kitchen' | 'reservations',
    event: string,
    data: unknown,
  ) {
    const room = `tenant-${tenantId}-${module}`;
    this.eventsGateway.server.to(room).emit(event, sanitizePayload(data));
  }
}
