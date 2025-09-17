import React from "react";
import { OrderCard } from "./order-card";

interface OrdersCardsViewProps {
  orders: any[];
  getStatusBadgeColor: (status: string) => string;
}

export const OrdersCardsView: React.FC<OrdersCardsViewProps> = ({ orders, getStatusBadgeColor }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
    {orders.map((order) => (
      <OrderCard key={order.id} order={order} getStatusBadgeColor={getStatusBadgeColor} />
    ))}
  </div>
); 