import { Order } from '@/types/order';
import { OrderCard } from "@/components/customs/admin/orders/order-card";

interface DashboardOrdersCardsViewProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
  onCancel: (orderId: string) => void;
  onPrintPDF: (order: Order) => void;
  formatCurrency: (amount: number) => string;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  typeLabels: Record<string, string>;
  isUpdating: boolean;
}

export function DashboardOrdersCardsView({
  orders,
  onStatusChange,
  onCancel,
  onPrintPDF,
  formatCurrency,
  statusColors,
  statusLabels,
  typeLabels,
  isUpdating
}: DashboardOrdersCardsViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
      {orders.map((order: Order) => (
        <OrderCard
          key={order.id}
          order={order}
          onStatusChange={onStatusChange}
          onCancel={onCancel}
          onPrintPDF={onPrintPDF}
          formatCurrency={formatCurrency}
          statusColors={statusColors}
          statusLabels={statusLabels}
          typeLabels={typeLabels}
          isUpdating={isUpdating}
        />
      ))}
    </div>
  );
} 