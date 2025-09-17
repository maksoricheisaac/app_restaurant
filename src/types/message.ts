export interface Message {
  id: string;
  customerName: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  type?: string | null;
  priority?: string | null;
  status: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
} 