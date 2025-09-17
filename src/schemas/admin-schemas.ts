import { z } from "zod";
import { $Enums } from "@/generated/prisma";

// --- Personnel Schemas ---
export const PersonnelSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  role: z.enum(["admin", "manager", "waiter", "kitchen", "cashier"]),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const UpdatePersonnelSchema = z.object({
  id: z.string(),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  role: z.enum(["admin", "manager", "waiter", "kitchen", "cashier"]),
});

// --- Settings Schemas ---

export const GeneralSettingsSchema = z.object({
  name: z.string().min(1, "Le nom du restaurant est requis."),
  deliveryEnabled: z.boolean(),
  takeawayEnabled: z.boolean(),
  dineInEnabled: z.boolean(),
});

export const OpeningHourSchema = z.object({
  id: z.string(),
  dayOfWeek: z.nativeEnum($Enums.DayOfWeek),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:MM invalide"),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:MM invalide"),
  isClosed: z.boolean(),
});

export const ExceptionalClosureSchema = z.object({
  date: z.date(),
  reason: z.string().optional(),
});

export const DeliveryZoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Le nom de la zone est requis."),
  price: z.coerce.number().min(0, "Le prix doit être positif."),
  isActive: z.boolean(),
});

export const OrderLimitsSchema = z.object({
  maxOrdersPerHour: z.coerce.number().int().min(0, "La limite doit être un entier positif."),
  maxOrdersPerUserHour: z.coerce.number().int().min(0, "La limite doit être un entier positif."),
});

export const SocialLinksSchema = z.object({
  facebookUrl: z.string().url().or(z.literal('')).optional(),
  instagramUrl: z.string().url().or(z.literal('')).optional(),
  twitterUrl: z.string().url().or(z.literal('')).optional(),
  linkedinUrl: z.string().url().or(z.literal('')).optional(),
  youtubeUrl: z.string().url().or(z.literal('')).optional(),
  tiktokUrl: z.string().url().or(z.literal('')).optional(),
});
