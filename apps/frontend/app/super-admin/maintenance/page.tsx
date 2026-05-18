'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Terminal,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SERVICES = [
  { id: 'api',      label: 'API Backend',       status: 'ok',      latency: '12ms',  icon: Zap },
  { id: 'db',       label: 'Base de données',    status: 'ok',      latency: '4ms',   icon: Database },
  { id: 'cdn',      label: 'CDN / Fichiers',     status: 'ok',      latency: '28ms',  icon: HardDrive },
  { id: 'email',    label: 'Service Email',      status: 'warning', latency: '340ms', icon: Wifi },
  { id: 'payments', label: 'Paiements (Stripe)', status: 'ok',      latency: '95ms',  icon: Activity },
  { id: 'ws',       label: 'WebSockets',         status: 'ok',      latency: '8ms',   icon: Cpu },
];

const EVENTS = [
  { time: '10:24', type: 'info',    msg: 'Déploiement v2.4.1 terminé avec succès' },
  { time: '09:15', type: 'warning', msg: 'Latence email élevée détectée (SMTP)' },
  { time: '08:00', type: 'info',    msg: 'Sauvegarde automatique DB complétée' },
  { time: '07:42', type: 'info',    msg: 'Cache Redis purgé — 1.2 GB libérés' },
  { time: 'Hier',  type: 'error',   msg: 'Pic de charge — auto-scaling déclenché' },
];

const STATUS_STYLE: Record<string, { dot: string; badge: string; label: string }> = {
  ok:      { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Opérationnel' },
  warning: { dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-100',       label: 'Dégradé' },
  error:   { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-100',             label: 'En panne' },
};

const EVENT_STYLE: Record<string, string> = {
  info:    'text-blue-600 bg-blue-50',
  warning: 'text-amber-600 bg-amber-50',
  error:   'text-red-600 bg-red-50',
};

export default function MaintenancePage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, label: string) => {
    setLoading(action);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(null);
    toast.success(`${label} effectué avec succès.`);
  };

  const allOk = SERVICES.every((s) => s.status === 'ok');

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Maintenance</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Surveillance du système et actions de maintenance.
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold',
          allOk
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
        )}>
          {allOk
            ? <><CheckCircle2 className="h-4 w-4" /> Tous les systèmes opérationnels</>
            : <><AlertTriangle className="h-4 w-4" /> Incidents en cours</>
          }
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Services status — 2/3 */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">État des services</p>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {SERVICES.map((svc, i) => {
              const Icon = svc.icon;
              const cfg = STATUS_STYLE[svc.status];
              return (
                <div
                  key={svc.id}
                  className={cn(
                    'flex items-center justify-between px-5 py-3.5',
                    i < SERVICES.length - 1 && 'border-b border-slate-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-800">{svc.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">{svc.latency}</span>
                    <span className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border',
                      cfg.badge
                    )}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Actions rapides</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'cache',  label: 'Vider le cache',     icon: Trash2,     color: 'text-red-500' },
              { id: 'db',     label: 'Sauvegarder la DB',  icon: Database,   color: 'text-blue-500' },
              { id: 'reload', label: 'Redémarrer les workers', icon: RefreshCw, color: 'text-violet-500' },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => handleAction(a.id, a.label)}
                  disabled={loading !== null}
                  className="bg-white border border-slate-100 rounded-xl p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all group disabled:opacity-60"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {loading === a.id
                      ? <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                      : <Icon className={cn('h-4 w-4', a.color)} />
                    }
                  </div>
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{a.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Maintenance mode toggle */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  maintenanceMode ? 'bg-amber-50' : 'bg-slate-50'
                )}>
                  <ShieldCheck className={cn('h-5 w-5', maintenanceMode ? 'text-amber-600' : 'text-slate-500')} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Mode maintenance</p>
                  <p className="text-xs text-slate-500 mt-0.5">
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
              <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700 font-medium">
                ⚠️ Les restaurants ne peuvent plus recevoir de commandes.
              </div>
            )}
          </div>

          {/* Journal */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
              <Terminal className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">Journal système</p>
            </div>
            <div className="divide-y divide-slate-50">
              {EVENTS.map((e, i) => (
                <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 w-8 flex-shrink-0">{e.time}</span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase flex-shrink-0', EVENT_STYLE[e.type])}>
                    {e.type}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">{e.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
