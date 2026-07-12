'use client';

import {
  Database, Zap, Activity, Cpu, HardDrive, RefreshCw, Clock, CheckCircle2,
  AlertTriangle, XCircle, Server, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHealth } from '@/hooks/api/useHealth';

type StatusKind = 'ok' | 'warn' | 'error' | 'muted';

function StatusDot({ kind }: { kind: StatusKind }) {
  const color =
    kind === 'ok' ? 'bg-emerald-500'
    : kind === 'warn' ? 'bg-amber-500'
    : kind === 'error' ? 'bg-red-500'
    : 'bg-slate-400';
  return <span className={cn('h-2 w-2 rounded-full', color)} />;
}

function statusIcon(kind: StatusKind) {
  if (kind === 'ok') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (kind === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  if (kind === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function MaintenancePage() {
  const { data: health, isLoading, refetch, isFetching } = useHealth();

  const dbKind: StatusKind = health?.checks.database.status === 'ok' ? 'ok' : 'error';
  const redisKind: StatusKind =
    health?.checks.redis.status === 'ok' ? 'ok'
    : health?.checks.redis.status === 'error' ? 'error'
    : 'muted';
  const memKind: StatusKind = health?.checks.memory.status === 'ok' ? 'ok' : 'warn';

  const services: { icon: typeof Zap; label: string; kind: StatusKind; detail: string }[] = [
    {
      icon: Database,
      label: 'Base de données',
      kind: dbKind,
      detail: health?.checks.database.latencyMs != null ? `${health.checks.database.latencyMs} ms` : '—',
    },
    {
      icon: HardDrive,
      label: 'Redis',
      kind: redisKind,
      detail:
        health?.checks.redis.status === 'not_configured'
          ? 'Non configuré'
          : health?.checks.redis.latencyMs != null
          ? `${health.checks.redis.latencyMs} ms`
          : '—',
    },
    {
      icon: Cpu,
      label: 'Mémoire',
      kind: memKind,
      detail: health ? `${health.checks.memory.heapUsedMb} / ${health.checks.memory.heapTotalMb} Mo` : '—',
    },
    {
      icon: Server,
      label: 'Processus API',
      kind: 'ok',
      detail: health ? `Node ${health.checks.process.nodeVersion}` : '—',
    },
  ];

  const globalOk = health?.status === 'ok';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Maintenance & Santé</h2>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            {isLoading ? (
              <>Chargement de l&apos;état…</>
            ) : (
              <>
                <StatusDot kind={globalOk ? 'ok' : 'warn'} />
                {globalOk ? 'Tous les services sont opérationnels.' : 'Un ou plusieurs services sont dégradés.'}
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted/40 disabled:opacity-60"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          Rafraîchir
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <>
          {/* État des services — données réelles /health */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              État des services
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.detail}</p>
                      </div>
                    </div>
                    {statusIcon(s.kind)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Métriques système réelles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Clock, label: 'Uptime', value: health ? formatUptime(health.uptime) : '—' },
              { icon: Activity, label: 'Environnement', value: health?.checks.process.env ?? '—' },
              { icon: Cpu, label: 'RSS', value: health ? `${health.checks.memory.rssMb} Mo` : '—' },
              { icon: Server, label: 'PID', value: health ? String(health.checks.process.pid) : '—' },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="rounded-xl border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[11px] uppercase tracking-wider font-medium">{m.label}</span>
                  </div>
                  <p className="text-lg font-bold text-foreground tabular-nums">{m.value}</p>
                </div>
              );
            })}
          </div>

          {health && (
            <p className="text-xs text-muted-foreground">
              Dernière mesure : {new Date(health.timestamp).toLocaleString('fr-FR')} · actualisé automatiquement toutes les 15 s.
            </p>
          )}
        </>
      )}
    </div>
  );
}
