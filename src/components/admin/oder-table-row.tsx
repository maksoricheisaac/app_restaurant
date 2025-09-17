"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface OrderTableRowProps {
  order: any;
  getStatusBadgeColor: (status: string) => string;
}

export const OrderTableRow: React.FC<OrderTableRowProps> = ({ order, getStatusBadgeColor }) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`/admin/orders/${order.id}`);
  };

  return (
    <TableRow onClick={handleNavigate} className="cursor-pointer">
      <TableCell>
        <div>
          <p className="font-medium">{order.customer?.name}</p>
          <p className="text-sm text-gray-500">{order.customer?.phone}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {order.items.map((item: any, index: number) => (
            <span key={item.id}>
              {item.quantity}x {item.name}
              {index < order.items.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getStatusBadgeColor(order.status)}>
          {order.status === "pending" && "En attente"}
          {order.status === "preparing" && "En préparation"}
          {order.status === "ready" && "Prête"}
          {order.status === "served" && "Servie"}
          {order.status === "cancelled" && "Annulée"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="font-medium">
          {order.total.toLocaleString()} FCFA
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {format(new Date(order.createdAt), "HH:mm")}
          <br />
          {format(new Date(order.createdAt), "dd/MM/yyyy")}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleNavigate(); }}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}; 