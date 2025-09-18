"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { UnpaidOrdersList } from "./unpaid-orders-list";
import { DailyCashSummary } from "./daily-cash-summary";
import { getUnpaidOrders } from "@/actions/admin/cash-register-actions";

// Minimal shape for unpaid orders used in this dashboard and UnpaidOrdersList
interface UnpaidOrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: { name: string };
}

interface UnpaidOrder {
  id: string;
  status: "ready" | "served" | string;
  createdAt: string | Date;
  total: number;
  customer?: { name?: string | null } | null;
  table?: { number: number } | null;
  orderItems: UnpaidOrderItem[];
}

// Minimal raw types returned by getUnpaidOrders action (only what we use)
interface RawUnpaidOrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem?: { name?: string | null } | null;
  name?: string | null;
}
interface RawUnpaidOrder {
  id: string;
  status: string;
  createdAt: string | Date;
  total?: number | null;
  user?: { name?: string | null } | null;
  table?: { number: number } | null;
  orderItems?: RawUnpaidOrderItem[];
}

function today() {
  return new Date();
}

export function CashRegisterDashboard() {
  const [date, setDate] = useState<Date>(today());
  const [unpaidOrders, setUnpaidOrders] = useState<UnpaidOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (selectedDate: Date) => {
    try {
      setLoading(true);
      const ordersData = await getUnpaidOrders({ date: selectedDate });
      const raw = (ordersData?.data?.orders ?? []) as RawUnpaidOrder[];
      const mapped: UnpaidOrder[] = raw.map((o) => ({
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        total: o.total ?? 0,
        customer: o.user ? { name: o.user.name ?? null } : null,
        table: o.table ? { number: o.table.number } : null,
        orderItems: (o.orderItems || []).map((it: RawUnpaidOrderItem) => ({
          id: it.id,
          quantity: it.quantity,
          price: it.price,
          menuItem: { name: it.menuItem?.name ?? it.name ?? "" },
        })),
      }));
      setUnpaidOrders(mapped);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(date);
  }, [date, fetchData]);

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bilan quotidien */}
      <DailyCashSummary selectedDate={date} onDateChange={handleDateChange} />

      {/* Commandes à payer (uniquement) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Commandes servies en attente de paiement
            <Badge variant="secondary">{unpaidOrders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UnpaidOrdersList
            orders={unpaidOrders}
            onPaymentProcessed={() => fetchData(date)}
            formatCurrency={formatCurrency}
          />
        </CardContent>
      </Card>
    </div>
  );
}