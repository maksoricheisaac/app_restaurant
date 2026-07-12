import { z } from 'zod';

/**
 * Ce fichier contient les schémas Zod utilisés pour la validation côté Frontend
 * (React Hook Form). Ces schémas sont alignés sur les DTOs class-validator du Backend.
 */

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  price: z.number().min(0, 'Le prix doit être positif'),
  image: z.string().optional(),
  categoryId: z.string().min(1, 'La catégorie est requise'),
  available: z.boolean().default(true),
});

export const orderItemSchema = z.object({
  menuItemId: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().min(1),
  price: z.number().min(0),
  image: z.string().optional(),
});

export const createOrderSchema = z.object({
  type: z.enum(['dine_in', 'takeaway', 'delivery']),
  tableId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Au moins un article est requis'),
  specialNotes: z.string().optional(),
  customerId: z.string().optional(),
  deliveryAddress: z.string().optional(),
});

export const reservationSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  time: z.string().optional(),
  guests: z.number().min(1, 'Au moins 1 invité'),
  customerName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  tableId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, '8 caractères minimum'),
});

// Onboarding step schemas
export const stepAccountCreationSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Au moins 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/\d/, 'Au moins un chiffre'),
});

export const stepRestaurantInfoSchema = z.object({
  restaurantName: z.string().min(1, 'Le nom du restaurant est requis'),
  slug: z
    .string()
    .min(2, 'Slug trop court')
    .max(50, 'Slug trop long')
    .regex(/^[a-z0-9-]+$/, 'Minuscules, chiffres et tirets uniquement'),
  country: z.string().min(1, 'Le pays est requis'),
  currency: z.string().min(1, 'La devise est requise'),
  timezone: z.string().min(1, 'Le fuseau horaire est requis'),
  cuisineType: z.string().optional(),
});

export const stepPlanSchema = z.object({
  // Clé de plan (data-driven — plus une enum figée).
  plan: z.string().min(1),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type OrderInput = z.infer<typeof createOrderSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;
export type StepAccountCreationInput = z.infer<typeof stepAccountCreationSchema>;
export type StepRestaurantInfoInput = z.infer<typeof stepRestaurantInfoSchema>;
