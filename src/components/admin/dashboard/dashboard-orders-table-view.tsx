import { Order } from '@/types/order';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardOrdersTableViewProps {
  orders: Order[];
  getStatusBadgeColor: (status: string) => string;
}

export function DashboardOrdersTableView({ orders, getStatusBadgeColor }: DashboardOrdersTableViewProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <ShoppingCart className="h-8 w-8 mb-2" />
        <p className="text-sm font-medium">Aucune commande trouvée</p>
      </div>
    );
  }

  return (
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
          {orders.map((order: Order) => (
            <TableRow key={order.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{order.user.name}</p>
                  <p className="text-sm text-gray-500">{order.user.phone}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {order.orderItems.map((item, index: number) => (
                    <span key={item.id}>
                      {item.quantity}x {item.name}
                      {index < order.orderItems.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  {order.deliveryFee && order.deliveryFee > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      + Livraison: {order.deliveryFee.toLocaleString()} FCFA
                    </div>
                  )}
                  {order.specialNotes && (
                    <div className="text-xs text-amber-600 mt-1 italic">
                      Note: {order.specialNotes}
                    </div>
                  )}
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
                  {(order.total || 0).toLocaleString()} FCFA
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
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 