"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { UnpaidOrdersList } from "./unpaid-orders-list";
import { DailyCashSummary } from "./daily-cash-summary";
import { CashSessionCard } from "./cash-session-card";
import { useUnpaidOrders } from "@/hooks/api/useCashRegister";

function today() {
  return new Date();
}

export function CashRegisterDashboard() {
  const [date, setDate] = useState<Date>(today());

  // UnpaidOrdersList manages its own data via useUnpaidOrders.
  // We only need the count here for the badge.
  const { data: unpaidData } = useUnpaidOrders();
  const unpaidCount = Array.isArray(unpaidData) ? unpaidData.length : 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF" }).format(amount);

  return (
    <div className="space-y-6">
      {/* Session de caisse (ouverture/fermeture/réconciliation) */}
      <CashSessionCard />

      {/* Daily bilan */}
      <DailyCashSummary selectedDate={date} onDateChange={setDate} />

      {/* Unpaid orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Commandes en attente de paiement
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {unpaidCount}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UnpaidOrdersList formatCurrency={formatCurrency} />
        </CardContent>
      </Card>
    </div>
  );
}
