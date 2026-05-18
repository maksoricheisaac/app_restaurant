export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive';
  logo?: string | null;
  primaryColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: 'owner' | 'manager' | 'waiter' | 'head_chef' | 'chef' | 'cashier';
  createdAt: Date;
  updatedAt: Date;
  user?: any;
  tenant?: Tenant;
}
