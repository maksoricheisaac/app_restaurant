export type OrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";
export type DashboardOrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";

export type OrderType = "dine_in" | "takeaway" | "delivery";

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string | null;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  type: OrderType;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  tableId?: string | null;
  table?: {
    id: string;
    number: number;
    seats: number;
  } | null;
  orderItems: OrderItem[];
  total?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtendedOrder extends Order {
  email?: string;
  phone?: string;
  time?: string;
  date?: Date;
  tip?: number;
}

export interface OrderHistoryResponse {
  orders: ExtendedOrder[];
}

// --- Cash Register Types ---
export type PaymentMethod = "cash";
export type PaymentStatus = "completed" | "refunded" | "cancelled";
export type TransactionType = "sale" | "refund" | "adjustment";

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  cashierId: string;
  cashier: {
    id: string;
    name: string;
    email: string;
  };
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  description?: string | null;
  cashierId: string;
  cashier: {
    id: string;
    name: string;
    email: string;
  };
  orderId?: string | null;
  order?: Order | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashRegisterStats {
  totalSales: number;
  totalTransactions: number;
  salesByMethod: Record<PaymentMethod, number>;
  salesByHour: Record<string, number>;
  todaySales: number;
  todayTransactions: number;
  totalRefunds: number;
  totalAdjustments: number;
  netSales: number;
}

export interface CashRegisterFilters {
  dateFrom?: Date;
  dateTo?: Date;
  cashierId?: string;
  paymentMethod?: PaymentMethod;
  transactionType?: TransactionType;
}

// --- Daily Cash Summary ---
export interface CashDailySummary {
  date: string; // ISO date for the day (yyyy-MM-dd)
  servedOrdersCount: number;
  expectedAmount: number; // sum of totals from served orders of the day
  receivedCash: number; // total cash received for the day
  variance: number; // receivedCash - expectedAmount
}