"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Printer } from "lucide-react";
import { getDailyCashSummary } from "@/actions/admin/cash-register-actions";
import { generateDailyCashSummaryPdf } from "@/lib/pdf/daily-cash-summary";
import type { CashDailySummary as CashDailySummaryType } from "@/types/order";

interface DailyCashSummaryProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF" }).format(
    amount ?? 0
  );
}

export function DailyCashSummary({ selectedDate, onDateChange }: DailyCashSummaryProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<CashDailySummaryType | null>(null);
  console.log('Summary : ', summary)
  const loadSummary = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      const res = await getDailyCashSummary({ date });
      const data = (res as any)?.data ?? res;
      setSummary(data);
    } catch (e) {
      console.error("Erreur chargement bilan quotidien:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(selectedDate);
  }, [selectedDate, loadSummary]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    onDateChange(newDate);
  };

  const addDays = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    onDateChange(newDate);
  };

  const onPrint = async () => {
    if (!summary) return;
    try {
      await generateDailyCashSummaryPdf(summary);
    } catch (e) {
      console.error("Erreur génération PDF bilan:", e);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Bilan de Caisse Journalier</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => addDays(-1)} title="Jour précédent">⟨</Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <Input type="date" value={selectedDate.toISOString().slice(0, 10)} onChange={handleDateChange} />
          </div>
          <Button variant="outline" size="icon" onClick={() => addDays(1)} title="Jour suivant">⟩</Button>
          <Button onClick={onPrint} className="flex items-center gap-2 cursor-pointer"><Printer className="w-4 h-4" /> Imprimer Bilan</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-gray-500">Chargement...</div>}
        {!loading && summary && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">Date</div>
            <div className="text-lg font-semibold">{summary.date}</div>
            <div className="text-sm text-gray-600 mt-4">Commandes servies</div>
            <div className="text-2xl font-bold">{summary.servedOrdersCount}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 rounded border">
                <div className="text-sm text-gray-600">Montant attendu</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(summary.expectedAmount)}</div>
              </div>
              <div className="p-3 rounded border">
                <div className="text-sm text-gray-600">Montant reçu (espèces)</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(summary.receivedCash)}</div>
              </div>
            </div>
            <div className="p-3 rounded border mt-4">
              <div className="text-sm text-gray-600">Écart</div>
              <div className={`text-xl font-bold ${summary.variance === 0 ? 'text-gray-900' : summary.variance > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(summary.variance)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
