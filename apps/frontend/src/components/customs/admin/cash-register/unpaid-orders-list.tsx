"use client";

import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeFormat } from "@/lib/utils";
import { fr } from "date-fns/locale";
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  User, 
  Table,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { useUnpaidOrders } from "@/hooks/api/useCashRegister";
import { useProcessPayment } from "@/hooks/api/useCashRegisterMutations";
import { toast } from "sonner";
import { PaymentMethod, type OrderItemOption } from "@/types/order";
import { OrderItemOptions } from "@/components/common/order-item-options";

interface UnpaidOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  menuItem: { name: string };
  options?: OrderItemOption[] | null;
}

interface UnpaidOrder {
  id: string;
  status: "ready" | "served" | string;
  createdAt: string | Date;
  total: number;
  customer?: { name?: string | null } | null;
  user?:     { name?: string | null } | null;
  table?: { number: number } | null;
  orderItems: UnpaidOrderItem[];
}

interface UnpaidOrdersListProps {
  formatCurrency: (amount: number) => string;
}

export function UnpaidOrdersList({ formatCurrency }: UnpaidOrdersListProps) {
  const [selectedOrder, setSelectedOrder] = useState<UnpaidOrder | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    amount: number | null;
    method: PaymentMethod;
  }>({ 
    amount: 0, 
    method: "cash" as PaymentMethod, 
  });
  

  const { data: unpaidOrdersData } = useUnpaidOrders();
  const processPaymentMutation = useProcessPayment();

  // Backend returns a plain array — cast from untyped query result
  const unpaidOrdersArray: UnpaidOrder[] = Array.isArray(unpaidOrdersData)
    ? (unpaidOrdersData as UnpaidOrder[])
    : [];

  const handlePayment = async () => {
    if (!selectedOrder || paymentData.amount === null) return;

    try {
      setProcessingPayment(true);
      await processPaymentMutation.mutateAsync({
        orderId: selectedOrder.id,
        // Prisma Decimal serialises to string in JSON — coerce to JS number
        amount: Number(paymentData.amount),
        method: paymentData.method,
      });

      toast.success(`Le paiement de ${formatCurrency(paymentData.amount)} a été enregistré avec succès.`);

      setPaymentDialogOpen(false);
      setSelectedOrder(null);
      setPaymentData({ amount: 0, method: "cash" });
    } catch {
      toast.error("Une erreur est survenue lors du traitement du paiement.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const openPaymentDialog = (order: UnpaidOrder) => {
    setSelectedOrder(order);
    // Coerce Decimal string from API to JS number
    setPaymentData({ amount: Number(order.total) || 0, method: "cash" });

    setPaymentDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800";
      case "served":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ready":
        return "Prête";
      case "served":
        return "Servie";
      default:
        return status;
    }
  };

  if (unpaidOrdersArray.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune commande en attente
        </h3>
        <p className="text-gray-500">
          Toutes les commandes ont été payées.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unpaidOrdersArray.map((order: UnpaidOrder) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Commande #{order.id.slice(-6).toUpperCase()}
                  </CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {order.customer?.name ?? order.user?.name ?? 'Invité'}
                    </span>
                  </div>
                  
                  {order.table && (
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Table {order.table.number}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {safeFormat(order.createdAt, "dd/MM/yyyy HH:mm", { locale: fr })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Articles :</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between gap-2 text-sm text-gray-600">
                        <span className="min-w-0">
                          {item.quantity}× {item.menuItem?.name ?? item.name ?? '?'}
                          <OrderItemOptions options={item.options} />
                        </span>
                        <span className="flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 ml-6">
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(Number(order.total))}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.orderItems.length} article{order.orderItems.length > 1 ? 's' : ''}
                  </div>
                </div>

                <Button
                  onClick={() => openPaymentDialog(order)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  Encaisser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Dialog de paiement */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Traitement du paiement
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">
                  Commande #{selectedOrder.id.slice(-6).toUpperCase()}
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Client: {selectedOrder.customer?.name ?? selectedOrder.user?.name ?? 'Invité'}</div>
                  <div>Total: {formatCurrency(Number(selectedOrder.total))}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Montant reçu</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    value={paymentData.amount === null ? "" : paymentData.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPaymentData(prev => ({
                        ...prev,
                        amount: value === "" ? null : Math.max(0, parseFloat(value))
                      }));
                    }}
                    placeholder="Montant"
                  />

                </div>

                <div className="p-3 bg-gray-50 border rounded-lg">
                  <div className="text-sm text-gray-700">
                    Mode de paiement: <span className="font-semibold">Espèces</span>
                  </div>
                </div>

                {paymentData.amount !== null && paymentData.amount > Number(selectedOrder.total) && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Monnaie à rendre</span>
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      {formatCurrency((paymentData.amount || 0) - Number(selectedOrder.total))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                  className="flex-1 cursor-pointer"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={processingPayment || paymentData.amount === null || paymentData.amount < Number(selectedOrder.total)}
                  className="flex-1 cursor-pointer"
                >
                  {processingPayment ? "Traitement..." : "Confirmer le paiement"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 