import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderTableRow } from "./oder-table-row";

interface OrdersTableViewProps {
  orders: any[];
  getStatusBadgeColor: (status: string) => string;
}

export const OrdersTableView: React.FC<OrdersTableViewProps> = ({ orders, getStatusBadgeColor }) => (
  <div className="rounded-md border overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Commande</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <OrderTableRow key={order.id} order={order} getStatusBadgeColor={getStatusBadgeColor} />
        ))}
      </TableBody>
    </Table>
  </div>
); 