import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, User, CalendarDays, ShoppingCart, CreditCard, Hash, Printer, XCircle, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import React from "react";

interface OrderCardProps {
  order: any;
  getStatusBadgeColor: (status: string) => string;
}

const ORDER_TYPES: Record<string, string> = {
  dinein: "Sur place",
  takeaway: "À emporter",
  delivery: "Livraison",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "preparing", label: "En préparation" },
  { value: "ready", label: "Prête" },
  { value: "served", label: "Servie" },
  { value: "cancelled", label: "Annulée" },
];

export const OrderCard: React.FC<OrderCardProps> = ({ order, getStatusBadgeColor }) => {
  // Actions à implémenter avec les vraies fonctions
  const onCancel = () => {
    // TODO: Implémenter la vraie fonction d'annulation
    console.log(`Annuler commande #${order.id}`);
  };
  
  const onPrint = () => {
    // TODO: Implémenter la vraie fonction d'impression
    console.log(`Imprimer commande #${order.id}`);
  };
  
  const onStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // TODO: Implémenter la vraie fonction de changement de statut
    console.log(`Changer statut commande #${order.id} en ${e.target.value}`);
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary/40">
      <div className={
        [
          "absolute top-0 left-0 w-1 h-full",
          order.status === "pending" && "bg-yellow-500",
          order.status === "preparing" && "bg-blue-500",
          order.status === "served" && "bg-green-500",
          order.status === "cancelled" && "bg-red-500"
        ].filter(Boolean).join(" ")
      } />
      <CardHeader className="pb-2 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Hash className="w-4 h-4" />
            <span>#{order.id}</span>
            {order.type && (
              <Badge variant="outline" className="ml-2 text-xs border-primary text-primary">
                {ORDER_TYPES[order.type] || order.type}
              </Badge>
            )}
          </div>
          <Badge className={getStatusBadgeColor(order.status)}>
            {STATUS_OPTIONS.find(opt => opt.value === order.status)?.label || order.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CalendarDays className="w-4 h-4" />
          <span>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</span>
        </div>
      </CardHeader>
      <CardContent className="pb-2 space-y-2">
        {/* Client */}
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-primary" />
          <span className="font-semibold">{order?.customer?.name || 'Client inconnu'}</span>
          <span className="text-xs text-gray-500">{order.customer?.phone}</span>
          {order.customer?.email && <span className="text-xs text-gray-400">{order.customer.email}</span>}
        </div>
        {/* Produits */}
        <div className="bg-gray-50 rounded-md p-2 border">
          <div className="font-semibold text-xs text-gray-500 mb-1">Produits commandés :</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left">Qté</th>
                <th className="text-left">Produit</th>
                <th className="text-right">PU</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td>{item.quantity}</td>
                  <td>{item.name}</td>
                  <td className="text-right">{typeof item.price === 'number' ? item.price.toLocaleString() : '-'}</td>
                  <td className="text-right">{typeof item.price === 'number' && typeof item.quantity === 'number' ? (item.price * item.quantity).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paiement */}
        {order.paymentMethod && (
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="font-medium">{order.paymentMethod}</span>
          </div>
        )}
        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t mt-2">
          <div className="text-xs text-gray-500">
            Créée à {format(new Date(order.createdAt), "HH:mm:ss")}
          </div>
          <p className="font-bold text-lg text-primary">{order.total.toLocaleString()} FCFA</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <div className="flex items-center gap-2 w-full">
          {/* Changer le statut */}
          <select
            className="border rounded px-2 py-1 text-xs focus:outline-primary"
            value={order.status}
            onChange={onStatusChange}
            disabled={order.status === 'cancelled' || order.status === 'served'}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Annuler */}
          {order.status !== 'cancelled' && order.status !== 'served' && (
            <Button variant="destructive" size="sm" onClick={onCancel} className="flex items-center gap-1">
              <XCircle className="w-4 h-4" /> Annuler
            </Button>
          )}
          {/* Imprimer */}
          {order.status === 'served' && (
            <Button variant="outline" size="sm" onClick={onPrint} className="flex items-center gap-1 border-primary text-primary">
              <Printer className="w-4 h-4" /> Imprimer
            </Button>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-primary border-primary hover:bg-primary/10 font-semibold px-4 w-full"
        >
          Détails <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
} 