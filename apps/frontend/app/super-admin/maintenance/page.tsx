'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Zap,
  RefreshCw,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Terminal,
  Trash2,
  Clock,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function MaintenancePage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, label: string) => {
    setLoading(action);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(null);
    toast.success(`${label} effectué avec succès.`);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Maintenance</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Surveillance du système et actions de maintenance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* État des services — placeholder en attendant l'API health */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            État des services
          </p>
          <div className="rounded-xl border border-border bg-card">
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Activity className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Monitoring bientôt disponible
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Les statuts et latences en temps réel seront disponibles via
                  l&apos;endpoint <span className="font-mono">/health</span> de l&apos;API.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 pt-1 text-[11px] text-muted-foreground">
                {[
                  { icon: Zap,      label: 'API Backend' },
                  { icon: Database, label: 'Base de données' },
                  { icon: HardDrive,label: 'CDN / Fichiers' },
                  { icon: Wifi,     label: 'Service Email' },
                  { icon: Activity, label: 'Paiements' },
                  { icon: Cpu,      label: 'WebSockets' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
            Actions rapides
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'cache',  label: 'Vider le cache',        icon: Trash2,   color: 'text-red-500' },
              { id: 'db',     label: 'Sauvegarder la DB',     icon: Database, color: 'text-blue-500' },
              { id: 'reload', label: 'Redémarrer les workers', icon: RefreshCw,color: 'text-violet-500' },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => handleAction(a.id, a.label)}
                  disabled={loading !== null}
                  className="bg-card border border-border rounded-xl p-4 text-left hover:border-border/60 hover:shadow-sm transition-all group disabled:opacity-60"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {loading === a.id
                      ? <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      : <Icon className={cn('h-4 w-4', a.color)} />
                    }
                  </div>
                  <p className="text-sm font-semibold text-foreground">{a.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Maintenance mode toggle */}
          <div className="rounded-xl border border-border bg-card shadow-xs p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  maintenanceMode ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-muted'
                )}>
                  <ShieldCheck className={cn(
                    'h-5 w-5',
                    maintenanceMode ? 'text-amber-600' : 'text-muted-foreground'
                  )} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Mode maintenance</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {maintenanceMode
                      ? 'La plateforme est inaccessible aux clients.'
                      : 'La plateforme est en ligne.'}
                  </p>
                </div>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={(v) => {
                  setMaintenanceMode(v);
                  toast[v ? 'warning' : 'success'](
                    v ? 'Mode maintenance activé.' : 'Mode maintenance désactivé.'
                  );
                }}
              />
            </div>
            {maintenanceMode && (
              <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                ⚠️ Les restaurants ne peuvent plus recevoir de commandes.
              </div>
            )}
          </div>

          {/* Journal — placeholder */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Journal système</p>
            </div>
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
              <Clock className="h-6 w-6 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                Le journal d&apos;événements sera disponible via
                l&apos;endpoint <span className="font-mono">/admin/logs</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
