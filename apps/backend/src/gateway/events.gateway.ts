import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { STAFF_ROOM, orderTrackingRoom } from './events.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:4000',
        ],
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Ordre de résolution du jeton :
      //   1. En-tête Authorization: Bearer <token> (clients API explicites)
      //   2. auth.token du handshake socket (clients socket explicites)
      //   3. Cookie httpOnly `token` (navigateurs avec withCredentials: true)
      const cookieHeader = client.handshake.headers.cookie ?? '';
      const cookieToken = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .reduce<string | null>((found, part) => {
          if (found) return found;
          const [k, ...v] = part.split('=');
          return k.trim() === 'token' ? decodeURIComponent(v.join('=')) : null;
        }, null);

      const token =
        client.handshake.headers.authorization?.split(' ')[1] ??
        (client.handshake.auth as Record<string, string>)?.token ??
        cookieToken ??
        undefined;

      if (!token) return;

      const decoded = this.jwtService.verify(token);

      // Le compte est relu en base, comme sur les routes HTTP : un employé
      // désactivé ne doit pas continuer à recevoir les commandes en direct.
      const account = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true, role: true, status: true },
      });

      if (!account || account.status !== 'active') return;

      client.data.user = account;

      // Membre du personnel authentifié : il rejoint le salon unique de
      // l'établissement. Plus rien à demander, plus rien à vérifier.
      await client.join(STAFF_ROOM);
    } catch {
      // Jeton invalide — le client reste anonyme (suivi de commande seulement)
    }
  }

  handleDisconnect(_client: Socket) {
    // no-op
  }

  /**
   * Suivi public d'une commande. Le client anonyme n'a que l'UUID reçu dans
   * son lien de suivi — 122 bits d'entropie, l'énumération n'est pas une
   * menace praticable.
   */
  @SubscribeMessage('join-order')
  async handleJoinOrder(client: Socket, payload: { orderId: string }) {
    const { orderId } = payload ?? {};
    if (!orderId || typeof orderId !== 'string') {
      return { status: 'error', message: 'Invalid orderId' };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) {
      return { status: 'error', message: 'Order not found' };
    }

    const room = orderTrackingRoom(orderId);
    await client.join(room);
    return { status: 'ok', room };
  }
}
