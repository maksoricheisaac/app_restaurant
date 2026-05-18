import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001'],
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
      // Token only from Authorization header — never from query params (logged by servers)
      const token = client.handshake.headers.authorization?.split(' ')[1]
        ?? (client.handshake.auth as Record<string, string>)?.token;

      if (token) {
        const decoded = this.jwtService.verify(token);
        client.data.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          tenantId: decoded.tenantId,
        };
      }
    } catch {
      // Invalid token — client stays unauthenticated (can only use public rooms)
    }
  }

  handleDisconnect(_client: Socket) {
    // no-op
  }

  @SubscribeMessage('join-tenant')
  async handleJoinTenant(client: Socket, payload: { tenantId: string }) {
    const { tenantId } = payload;
    const user = client.data.user;

    if (!user) {
      return { status: 'error', message: 'Unauthorized' };
    }

    // Vérifier si l'utilisateur est membre du tenant
    const membership = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenantId,
        },
      },
    });

    if (!membership) {
      console.warn(
        `User ${user.id} tried to join unauthorized tenant room: ${tenantId}`,
      );
      return { status: 'error', message: 'Forbidden' };
    }

    const room = `tenant-${tenantId}`;
    client.join(room);
    console.log(`User ${user.id} joined room ${room}`);
    return { status: 'ok', room };
  }

  @SubscribeMessage('join-order')
  async handleJoinOrder(client: Socket, payload: { orderId: string }) {
    const { orderId } = payload;
    if (!orderId || typeof orderId !== 'string') {
      return { status: 'error', message: 'Invalid orderId' };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, tenantId: true },
    });
    if (!order) {
      return { status: 'error', message: 'Order not found' };
    }

    const user = client.data.user as { id?: string; tenantId?: string } | undefined;

    if (user?.id) {
      // Authenticated staff: verify the order belongs to their tenant.
      if (user.tenantId && user.tenantId !== order.tenantId) {
        return { status: 'error', message: 'Forbidden' };
      }
      if (!user.tenantId) {
        // Token present but no tenantId claim — check membership explicitly.
        const membership = await this.prisma.tenantMembership.findFirst({
          where: { userId: user.id, tenantId: order.tenantId },
          select: { id: true },
        });
        if (!membership) {
          return { status: 'error', message: 'Forbidden' };
        }
      }
    }
    // Unauthenticated clients (public customers tracking their own order via UUID link) are
    // allowed through. UUIDs have 122 bits of entropy — enumeration is not a practical threat.

    const room = `order-tracking-${orderId}`;
    client.join(room);
    return { status: 'ok', room };
  }
}
