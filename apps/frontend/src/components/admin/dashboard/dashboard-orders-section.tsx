import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ShoppingCart } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Order, OrderStatus } from '@/types/order';
import { DashboardViewModeToggle } from "./dashboard-view-mode-toggle";
import { DashboardOrderFilters } from "./dashboard-order-filters";
import { DashboardOrdersCardsView } from "./dashboard-orders-cards-view";
import { DashboardOrdersTableView } from "./dashboard-orders-table-view";

interface DashboardOrdersSectionProps {
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  orderStatus: OrderStatus | undefined;
  onStatusChange: (status: OrderStatus | undefined) => void;
  orders: Order[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onStatusChangeOrder: (orderId: string, newStatus: Order['status']) => void;
  onCancel: (orderId: string) => void;
  onPrintPDF: (order: Order) => void;
  formatCurrency: (amount: number) => string;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  typeLabels: Record<string, string>;
  isUpdating: boolean;
  getStatusBadgeColor: (status: string) => string;
}

export function DashboardOrdersSection({
  viewMode,
  onViewModeChange,
  orderStatus,
  onStatusChange,
  orders,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onStatusChangeOrder,
  onCancel,
  onPrintPDF,
  formatCurrency,
  statusColors,
  statusLabels,
  typeLabels,
  isUpdating,
  getStatusBadgeColor
}: DashboardOrdersSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <CardTitle>Dernières commandes</CardTitle>
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <DashboardViewModeToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
            <DashboardOrderFilters
              orderStatus={orderStatus}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-3">
              <ShoppingCart className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Aucune commande</p>
            <p className="text-xs text-muted-foreground mt-1">
              Les nouvelles commandes apparaîtront ici en temps réel.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <DashboardOrdersCardsView
            orders={orders}
            onStatusChange={onStatusChangeOrder}
            onCancel={onCancel}
            onPrintPDF={onPrintPDF}
            formatCurrency={formatCurrency}
            statusColors={statusColors}
            statusLabels={statusLabels}
            typeLabels={typeLabels}
            isUpdating={isUpdating}
          />
        ) : (
          <DashboardOrdersTableView
            orders={orders}
            getStatusBadgeColor={getStatusBadgeColor}
          />
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between px-2 space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-500 order-2 sm:order-1">
              Page {page} sur {totalPages}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 