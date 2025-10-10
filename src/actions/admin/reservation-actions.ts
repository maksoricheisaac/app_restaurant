"use server";

import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher";
import { requireStaff } from "@/lib/auth-helpers";

// Schema for reservation validation
const reservationSchema = z.object({
  customerName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
  date: z.string().min(1, "La date est requise"),
  time: z.string().min(1, "L'heure est requise"),
  guests: z.number().int().positive("Le nombre de convives doit être positif"),
  tableId: z.string().uuid("Invalid table ID").optional(),
  status: z.enum(["pending", "confirmed", "cancelled"]),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  userId: z.string().cuid("Invalid user ID").optional(),
});

// Get all reservations
export const getReservations = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      await requireStaff();
      const reservations = await prisma.reservation.findMany({
        include: {
          user: true,
          table: true,
        },
        orderBy: [
          {
            date: 'asc',
          },
          {
            time: 'asc',
          },
        ],
      });
      
      return { success: true, data: { data: reservations } };
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      throw new Error('Impossible de charger les réservations pour le moment.');
    }
  });

// Get reservation by ID
export const getReservationById = actionClient
  .schema(z.object({
    id: z.string().uuid("Invalid reservation ID"),
  }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: {
          user: true,
          table: true,
        },
      });
      
      if (!reservation) {
        throw new Error('Réservation non trouvée');
      }
      
      return { success: true, data: reservation };
    } catch (error) {
      console.error('Erreur lors de la récupération de la réservation:', error);
      throw new Error('Impossible de charger la réservation pour le moment.');
    }
  });

// Create reservation
export const createReservation = actionClient
  .schema(reservationSchema)
  .action(async ({ parsedInput }) => {
    try {
      const reservation = await prisma.reservation.create({
        data: {
          customerName: parsedInput.customerName,
          email: parsedInput.email,
          phone: parsedInput.phone,
          date: new Date(parsedInput.date),
          time: parsedInput.time,
          guests: parsedInput.guests,
          status: parsedInput.status,
          notes: parsedInput.notes,
          specialRequests: parsedInput.specialRequests,
          userId: parsedInput.userId,
          tableId: parsedInput.tableId,
        },
        include: {
          user: true,
          table: true,
        },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-reservations', 'new-reservation', {
          reservation: {
            id: reservation.id,
            customerName: reservation.customerName,
            email: reservation.email,
            date: reservation.date,
            time: reservation.time,
            guests: reservation.guests,
            status: reservation.status,
            createdAt: reservation.createdAt,
          }
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true, data: reservation };
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      throw new Error('Impossible de créer la réservation pour le moment.');
    }
  });

// Update reservation
export const updateReservation = actionClient
  .schema(reservationSchema.extend({
    id: z.string().uuid("Invalid reservation ID"),
  }))
  .action(async ({ parsedInput: { id, ...data } }) => {
    try {
      const reservation = await prisma.reservation.update({
        where: { id },
        data: {
          customerName: data.customerName,
          email: data.email,
          phone: data.phone,
          date: new Date(data.date),
          time: data.time,
          guests: data.guests,
          status: data.status,
          notes: data.notes,
          specialRequests: data.specialRequests,
          userId: data.userId,
          tableId: data.tableId,
        },
        include: {
          user: true,
          table: true,
        },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-reservations', 'reservation-updated', {
          reservation: {
            id: reservation.id,
            customerName: reservation.customerName,
            email: reservation.email,
            date: reservation.date,
            time: reservation.time,
            guests: reservation.guests,
            status: reservation.status,
            updatedAt: reservation.updatedAt,
          }
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true, data: reservation };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réservation:', error);
      throw new Error('Impossible de mettre à jour la réservation pour le moment.');
    }
  });

// Delete reservation
export const deleteReservation = actionClient
  .schema(z.object({
    id: z.string().uuid("Invalid reservation ID"),
  }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      await prisma.reservation.delete({
        where: { id },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-reservations', 'reservation-deleted', {
          reservationId: id
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de la réservation:', error);
      throw new Error('Impossible de supprimer la réservation pour le moment.');
    }
  }); 