import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LayoutGrid, Table2, ShoppingCart } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import React from "react";
import { OrdersCardsView } from "./orders-cards-view";
import { OrdersTableView } from "./orders-tables-views";

interface DashboardOrdersProps {
  ordersData: {
    data?: {
      orders?: unknown[];
      pagination?: {
        totalPages?: number;
      };
    };
  };
  isLoadingOrders: boolean;
  viewMode: 'cards' | 'table';
  setViewMode: (mode: 'cards' | 'table') => void;
  orderStatus: "pending" | "preparing" | "ready" | "served" | "cancelled" | undefined;
  setOrderStatus: (status: "pending" | "preparing" | "ready" | "served" | "cancelled" | undefined) => void;
  page: number;
  setPage: (page: number) => void;
  getStatusBadgeColor: (status: string) => string;
}

export const DashboardOrders: React.FC<DashboardOrdersProps> = ({
  ordersData,
  isLoadingOrders,
  viewMode,
  setViewMode,
  orderStatus,
  setOrderStatus,
  page,
  setPage,
  getStatusBadgeColor,
}) => (
  <Card>
    <CardHeader>
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <CardTitle>Dernières commandes</CardTitle>
        </div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'cards' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="flex-1 sm:flex-none"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex-1 sm:flex-none"
            >
              <Table2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Tableau</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <Button
              variant={!orderStatus ? "secondary" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setOrderStatus(undefined)}
            >
              Toutes
            </Button>
            <Button
              variant={orderStatus === "pending" ? "secondary" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setOrderStatus("pending")}
            >
              <span className="hidden sm:inline">En </span>attente
            </Button>
            <Button
              variant={orderStatus === "preparing" ? "secondary" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setOrderStatus("preparing")}
            >
              <span className="hidden sm:inline">En </span>préparation
            </Button>
            <Button
              variant={orderStatus === "ready" ? "secondary" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setOrderStatus("ready")}
            >
              Prêtes
            </Button>
            <Button
              variant={orderStatus === "served" ? "secondary" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setOrderStatus("served")}
            >
              Servies
            </Button>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {isLoadingOrders ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement des commandes...</p>
        </div>
      ) : ordersData?.data?.orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <ShoppingCart className="h-8 w-8 mb-2" />
          <p className="text-sm font-medium">Aucune commande trouvée</p>
        </div>
      ) : viewMode === 'cards' ? (
        <OrdersCardsView orders={ordersData.data.orders} getStatusBadgeColor={getStatusBadgeColor} />
      ) : (
        <OrdersTableView orders={ordersData.data.orders} getStatusBadgeColor={getStatusBadgeColor} />
      )}
      {ordersData?.data?.pagination && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between px-2 space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-500 order-2 sm:order-1">
            Page {page} sur {ordersData.data.pagination.totalPages}
          </div>
          <Pagination
            currentPage={page}
            totalPages={ordersData.data.pagination.totalPages || 1}
            onPageChange={setPage}
          />
        </div>
      )}
    </CardContent>
  </Card>
); 