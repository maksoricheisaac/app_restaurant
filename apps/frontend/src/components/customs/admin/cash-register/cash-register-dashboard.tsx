"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { UnpaidOrdersList } from "./unpaid-orders-list";
import { DailyCashSummary } from "./daily-cash-summary";
import { useOrders } from "@/hooks/api/useOrders";
import { useQueryClient } from "@tanstack/react-query";

function today() {
  return new Date();
}

export function CashRegisterDashboard() {
  const [date, setDate] = useState<Date>(today());
  const queryClient = useQueryClient();

  // Utilisation du hook API NestJS pour récupérer les commandes prêtes ou servies
  const { data: ordersData, isLoading } = useOrders({
    status: 'served', // On ne paie que ce qui est servi
    date: date.toISOString(),
  });

  const unpaidOrders = (ordersData?.data || []).map((o: any) => ({
    id: o.id,
    status: o.status,
    createdAt: o.createdAt,
    total: o.total ?? 0,
    customer: o.user ? { name: o.user.name ?? null } : null,
    table: o.table ? { number: o.table.number } : null,
    orderItems: (o.orderItems || []).map((it: any) => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      menuItem: { name: it.name },
    })),
  }));

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
    }).format(amount);
  };

  if (isLoading) {
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
          <UnpaidOrdersList formatCurrency={formatCurrency} />
        </CardContent>
      </Card>
    </div>
  );
}