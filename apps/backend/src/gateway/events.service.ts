import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

/**
 * Salon unique du personnel. Tout le monde travaille sur le même
 * établissement : il n'y a plus de cloisonnement à faire, donc plus de room
 * ni de namespace à dériver d'un identifiant. Seul le suivi de commande côté
 * client garde un salon dédié, par commande.
 */
export const STAFF_ROOM = 'staff';

export const orderTrackingRoom = (orderId: string) =>
  `order-tracking-${orderId}`;

// Champs sensibles à ne jamais émettre via WebSocket
const SENSITIVE_FIELDS = new Set([
  'password',
  'tokenHash',
  'emailVerificationToken',
  'passwordResetToken',
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

  /** Diffuse à tout le personnel connecté. */
  emitToStaff(event: string, data: unknown) {
    this.eventsGateway.server.to(STAFF_ROOM).emit(event, sanitizePayload(data));
  }

  emitToRoom(room: string, event: string, data: unknown) {
    this.eventsGateway.server.to(room).emit(event, sanitizePayload(data));
  }

  /** Diffuse au client qui suit sa commande depuis le lien de suivi. */
  emitToOrderTracking(orderId: string, event: string, data: unknown) {
    this.emitToRoom(orderTrackingRoom(orderId), event, data);
  }
}
