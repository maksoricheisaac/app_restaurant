import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-500">Chargement des commandes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <ShoppingCart className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">Aucune commande trouvée</p>
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