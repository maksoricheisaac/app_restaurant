/**
 * Avancement d'un ticket, toujours déduit de ses lignes côté serveur.
 *
 * `open` : au moins une ligne en brouillon, le ticket est en cours de saisie.
 * `paid` : encaissé, contenu verrouillé.
 */
export type OrderStatus =
  | "open"
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "paid"
  | "cancelled";

export type DashboardOrderStatus = OrderStatus;

/** Cycle de vie d'une ligne de ticket. */
export type OrderLineStatus =
  | "draft"
  | "sent"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export type OrderType = "dine_in" | "takeaway" | "delivery";

/**
 * Option retenue sur une ligne de commande, telle que figée au moment de la
 * commande. Le libellé est conservé même si l'option change ensuite sur la
 * carte : c'est ce qui a réellement été commandé.
 */
export interface OrderItemOption {
  groupName: string;
  optionName: string;
  priceDelta: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  /** Prix unitaire options comprises. */
  price: number;
  image?: string | null;
  options?: OrderItemOption[] | null;

  status: OrderLineStatus;
  createdAt?: string | Date;
  /** Départ en cuisine. Les lignes d'une même tournée le partagent. */
  sentAt?: string | Date | null;
  cancelledAt?: string | Date | null;
  cancelReason?: string | null;
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
  /** Numéro de ticket du jour, affiché et prononcé par l'équipe. */
  number?: number;
  status: OrderStatus;
  type: OrderType;
  /** Horodatage de l'encaissement. Non nul = ticket verrouillé. */
  closedAt?: string | Date | null;
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
  deliveryFee?: number | null;
  specialNotes?: string | null;
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
export type PaymentMethod = "cash" | "card" | "online";
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
  changeGiven: number; // total change given back to customers
  variance: number; // receivedCash - expectedAmount
}