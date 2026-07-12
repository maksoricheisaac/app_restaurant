'use client';

import {
  CreditCard, Receipt, TrendingUp, Download, Users, ArrowUpRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useBillingStats } from '@/hooks/api/useDashboard';
import { currencySymbol } from '@/config/plans';

export default function SuperAdminBillingPage() {
  const { data: stats, isLoading } = useBillingStats();

  const fmt = (n: number) => n.toLocaleString('fr-FR');

  // Export CSV réel de la répartition par plan.
  const exportCsv = () => {
    if (!stats) return;
    const rows = [
      ['Plan', 'Cle', 'Prix mensuel', 'Abonnes', 'MRR'],
      ...stats.breakdown.map((b) => [
        b.name, b.key, String(b.monthlyPrice), String(b.count), String(b.mrr),
      ]),
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `facturation-flashmenu-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturation & Abonnements</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Revenus réels calculés depuis la répartition des plans de tous les restaurants.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={exportCsv} disabled={!stats}>
          <Download className="h-4 w-4" />
          Exporter (CSV)
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <>
          {/* Stats réelles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard
              title="MRR"
              value={`${fmt(stats?.mrr ?? 0)} €`}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="green"
              subtitle="Revenu mensuel récurrent"
            />
            <StatsCard
              title="ARR"
              value={`${fmt(stats?.arr ?? 0)} €`}
              icon={<Receipt className="h-5 w-5" />}
              variant="blue"
              subtitle="Revenu annuel récurrent"
            />
            <StatsCard
              title="Abonnés payants"
              value={stats?.payingTenants ?? 0}
              icon={<Users className="h-5 w-5" />}
              variant="purple"
              subtitle={`sur ${stats?.totalTenants ?? 0} restaurants`}
            />
            <StatsCard
              title="Taux de conversion"
              value={`${stats?.conversion ?? 0} %`}
              icon={<ArrowUpRight className="h-5 w-5" />}
              variant="orange"
              subtitle="Gratuit → Payant"
            />
          </div>

          {/* Répartition par plan */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Revenus par forfait
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 text-[11px] uppercase tracking-wider text-muted-foreground">Forfait</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Prix</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground text-center">Abonnés</TableHead>
                    <TableHead className="pr-6 text-[11px] uppercase tracking-wider text-muted-foreground text-right">MRR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats?.breakdown ?? []).map((b) => (
                    <TableRow key={b.key}>
                      <TableCell className="pl-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{b.name}</span>
                          {!b.isActive && (
                            <Badge variant="outline" className="text-[9px]">Inactif</Badge>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">{b.key}</span>
                      </TableCell>
                      <TableCell className="py-3 text-sm">
                        {b.monthlyPrice === 0
                          ? 'Gratuit'
                          : `${b.monthlyPrice} ${currencySymbol(b.currency)} / mois`}
                      </TableCell>
                      <TableCell className="py-3 text-center font-medium">{b.count}</TableCell>
                      <TableCell className="pr-6 py-3 text-right font-semibold tabular-nums">
                        {b.mrr === 0 ? '—' : `${fmt(b.mrr)} ${currencySymbol(b.currency)}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
