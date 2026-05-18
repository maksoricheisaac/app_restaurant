export type CustomerStatus = "active" | "inactive" | "vip";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  phone?: string;
  address?: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
} 