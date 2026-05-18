'use client';

import { useState } from 'react';
import {
  Globe,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Copy,
  Trash2,
  ExternalLink,
  Info,
  Search,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type DomainStatus = 'verified' | 'pending' | 'failed';

interface Domain {
  id: string;
  domain: string;
  tenant: string;
  status: DomainStatus;
  addedAt: string;
  cname: string;
}

const DOMAINS: Domain[] = [
  { id: '1', domain: 'menu.lebistro.fr',       tenant: 'Le Bistro',         status: 'verified', addedAt: '12 Jan 2026', cname: 'cname.flashmenu.app' },
  { id: '2', domain: 'commander.lapizzeria.it', tenant: 'La Pizzeria',       status: 'verified', addedAt: '18 Jan 2026', cname: 'cname.flashmenu.app' },
  { id: '3', domain: 'menu.sushitime.com',      tenant: 'Sushi Time',        status: 'pending',  addedAt: '05 Mai 2026', cname: 'cname.flashmenu.app' },
  { id: '4', domain: 'order.tacolocal.mx',      tenant: 'Taco Local',        status: 'failed',   addedAt: '10 Mai 2026', cname: 'cname.flashmenu.app' },
  { id: '5', domain: 'carte.leresto.fr',        tenant: 'Le Resto du Coin',  status: 'pending',  addedAt: '12 Mai 2026', cname: 'cname.flashmenu.app' },
];

const STATUS_CONFIG: Record<DomainStatus, { icon: typeof CheckCircle2; label: string; dot: string; className: string }> = {
  verified: { icon: CheckCircle2, label: 'Vérifié',     dot: 'bg-emerald-500', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  pending:  { icon: Clock,        label: 'En attente',  dot: 'bg-amber-500',   className: 'bg-amber-50 text-amber-700 border-amber-100' },
  failed:   { icon: XCircle,      label: 'Échec DNS',   dot: 'bg-red-500',     className: 'bg-red-50 text-red-700 border-red-100' },
};

function StatusBadge({ status }: { status: DomainStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border',
      cfg.className
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export default function DomainsPage() {
  const [search, setSearch] = useState('');
  const [domains, setDomains] = useState<Domain[]>(DOMAINS);
  const [verifying, setVerifying] = useState<string | null>(null);

  const filtered = domains.filter(
    (d) =>
      d.domain.toLowerCase().includes(search.toLowerCase()) ||
      d.tenant.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:    domains.length,
    verified: domains.filter((d) => d.status === 'verified').length,
    pending:  domains.filter((d) => d.status === 'pending').length,
    failed:   domains.filter((d) => d.status === 'failed').length,
  };

  const handleVerify = async (id: string) => {
    setVerifying(id);
    await new Promise((r) => setTimeout(r, 1500));
    setVerifying(null);
    toast.success('Vérification DNS relancée.');
  };

  const handleDelete = (id: string) => {
    setDomains((prev) => prev.filter((d) => d.id !== id));
    toast.success('Domaine supprimé.');
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers.');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Domaines</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Domaines personnalisés associés aux restaurants.
          </p>
        </div>
        <Button size="sm" className="shadow-sm shadow-primary/20">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Ajouter un domaine
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total domaines"
          value={stats.total}
          icon={<Globe className="h-5 w-5" />}
          variant="slate"
        />
        <StatsCard
          title="Vérifiés"
          value={stats.verified}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="green"
        />
        <StatsCard
          title="En attente"
          value={stats.pending}
          icon={<Clock className="h-5 w-5" />}
          variant="amber"
        />
        <StatsCard
          title="Échec DNS"
          value={stats.failed}
          icon={<XCircle className="h-5 w-5" />}
          variant="rose"
        />
      </div>

      {/* DNS instructions */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">Configuration DNS requise</p>
          <p className="text-blue-700 dark:text-blue-400 text-xs">
            Pour chaque domaine, créez un enregistrement{' '}
            <strong>CNAME</strong> pointant vers{' '}
            <button
              onClick={() => copy('cname.flashmenu.app')}
              className="font-mono bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors inline-flex items-center gap-1"
            >
              cname.flashmenu.app
              <Copy className="h-3 w-3" />
            </button>{' '}
            puis cliquez sur "Vérifier".
          </p>
        </div>
      </div>

      {/* Table card */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <CardHeader className="border-b p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Domaine, restaurant…"
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} domaine{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Globe className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="font-semibold">Aucun domaine trouvé</p>
              <p className="text-xs text-muted-foreground mt-1">
                Modifiez votre recherche ou ajoutez un domaine.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-muted flex-shrink-0">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold font-mono truncate">{d.domain}</p>
                        <a
                          href={`https://${d.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {d.tenant} · Ajouté le {d.addedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={d.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="gap-2 text-sm cursor-pointer"
                          onClick={() => handleVerify(d.id)}
                          disabled={verifying === d.id}
                        >
                          <RefreshCw className={cn('h-3.5 w-3.5 text-blue-500', verifying === d.id && 'animate-spin')} />
                          {verifying === d.id ? 'Vérification…' : 'Vérifier le DNS'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => copy(d.domain)}>
                          <Copy className="h-3.5 w-3.5" /> Copier le domaine
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-sm text-destructive cursor-pointer focus:text-destructive"
                          onClick={() => handleDelete(d.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
