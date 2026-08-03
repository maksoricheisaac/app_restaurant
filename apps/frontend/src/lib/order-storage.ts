// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";

export interface StoredOrder {
  orderId:        string;
  ref:            string;   // orderId.slice(-8).toUpperCase()
  createdAt:      string;   // ISO
  itemCount:      number;
  total:          number;
  currency:       string;
  status:         OrderStatus;
  restaurantName: string;
}

// Terminal statuses — orders with these statuses are purged after TTL_TERMINAL_MS
const TERMINAL: ReadonlySet<OrderStatus> = new Set(["served", "cancelled"]);
const TTL_ACTIVE_MS   = 24 * 60 * 60 * 1000; // 24 h — active orders
const TTL_TERMINAL_MS =  2 * 60 * 60 * 1000; // 2 h  — served / cancelled

const STORAGE_KEY = 'flashmenu_orders';

function isExpired(order: StoredOrder): boolean {
  const age = Date.now() - new Date(order.createdAt).getTime();
  return TERMINAL.has(order.status)
    ? age > TTL_TERMINAL_MS
    : age > TTL_ACTIVE_MS;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Commandes non expirées, de la plus récente à la plus ancienne. */
export function getStoredOrders(): StoredOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: StoredOrder[] = JSON.parse(raw);
    const valid = all.filter((o) => !isExpired(o));
    // Persist purged state back if entries were removed
    if (valid.length !== all.length) _write(valid);
    return valid.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

/** Returns only non-terminal orders (the ones the customer still cares about). */
export function getActiveOrders(): StoredOrder[] {
  return getStoredOrders().filter((o) => !TERMINAL.has(o.status));
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Persist a newly placed order. */
export function persistOrder(order: StoredOrder): void {
  if (typeof window === "undefined") return;
  const current = getStoredOrders();
  // Avoid duplicates (e.g. double-submit)
  const deduped = current.filter((o) => o.orderId !== order.orderId);
  _write([order, ...deduped]);
}

/** Update the cached status of an order (called from WebSocket events). */
export function updateStoredStatus(
  orderId: string,
  status: OrderStatus,
): void {
  if (typeof window === "undefined") return;
  const current = getStoredOrders();
  const updated = current.map((o) =>
    o.orderId === orderId ? { ...o, status } : o,
  );
  _write(updated);
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function _write(orders: StoredOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Storage quota exceeded — silently no-op
  }
}
