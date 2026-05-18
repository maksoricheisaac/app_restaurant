export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id: string;
  date: Date;
  time?: string | null | undefined;
  guests?: number | null;
  status: string;
  notes?: string | null;
  specialRequests?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  tableId?: string | null;
  table?: {
    id: string;
    number: number;
    seats: number;
  } | null;
  customerName?: string | null;
  email?: string | null;
  phone?: string | null;
} 