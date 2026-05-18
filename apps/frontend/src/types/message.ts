export type MessageStatus = 'new' | 'read' | 'replied' | 'closed' | 'archived';

export interface Message {
  id: string;
  tenantId: string;
  customerName: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  read: boolean;
  status?: MessageStatus;
  createdAt: Date;
}