"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

const contactInputSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, "Le message est requis"),
  guests: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
});

export const contactAction = actionClient
  .schema(contactInputSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Enregistrement du message dans la table Message
      const message = await prisma.message.create({
        data: {
          customerName: `${parsedInput.firstName} ${parsedInput.lastName}`,
          email: parsedInput.email,
          phone: parsedInput.phone,
          subject: parsedInput.subject || "Aucun sujet",
          message: parsedInput.message,
          type: parsedInput.subject || undefined,
          priority: parsedInput.guests ? `guests:${parsedInput.guests}` : undefined,
          status: "new",
          source: "contact-form",
        },
      });

      // Notification en temps réel via Pusher pour le message
      try {
        await pusherServer.trigger('admin-messages', 'new-message', {
          message: {
            id: message.id,
            customerName: message.customerName,
            email: message.email,
            subject: message.subject,
            status: message.status,
            createdAt: message.createdAt,
          }
        });
      } catch (pusherError) {
        console.error('Erreur Pusher pour le message:', pusherError);
        // On ne fait pas échouer l'action si Pusher échoue
      }

      // Si les champs de réservation sont fournis, créer une réservation
      if (parsedInput.guests && parsedInput.date && parsedInput.time) {
        try {
          const reservation = await prisma.reservation.create({
            data: {
              customerName: `${parsedInput.firstName} ${parsedInput.lastName}`,
              email: parsedInput.email,
              phone: parsedInput.phone || "",
              date: new Date(parsedInput.date),
              time: parsedInput.time,
              guests: parseInt(parsedInput.guests),
              status: "pending",
              notes: `Réservation créée via formulaire de contact. Message: ${parsedInput.message}`,
            },
          });

          // Notification en temps réel via Pusher pour la réservation
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
            console.error('Erreur Pusher pour la réservation:', pusherError);
            // On ne fait pas échouer l'action si Pusher échoue
          }
        } catch (reservationError) {
          console.error('Erreur lors de la création de la réservation:', reservationError);
          // On ne fait pas échouer l'action si la réservation échoue
          // On retourne quand même le succès du message
        }
      }

      return { success: true, data: { messageId: message.id } };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      // Gestion spécifique des erreurs Prisma
      if (error instanceof Error) {
        if (error.message.includes('P2002')) {
          throw new Error('Un message similaire a déjà été envoyé récemment.');
        }
        if (error.message.includes('P2025')) {
          throw new Error('Erreur de référence dans la base de données.');
        }
        if (error.message.includes('P2003')) {
          throw new Error('Données invalides pour la base de données.');
        }
      }
      
      throw new Error('Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.');
    }
  }); 