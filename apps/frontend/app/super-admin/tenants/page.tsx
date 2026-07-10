'use client';

import {
  Plus, Search, MoreVertical, ExternalLink, Store, Ban,
  CheckCircle2, AlertCircle, RefreshCw, Loader2, Sparkles, Building2,
  Eye, Users, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Label } from '@/components/ui/label';
import { useState, useMemo } from 'react';
import { cn, safeFormat } from '@/lib/utils';
import { useTenants } from '@/hooks/api/useDashboard';
import {
  useCreateTenant, useUpdateTenant, useTenantDetail,
} from '@/hooks/api/useSuperAdmin';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

// ─── Types / Config ──────────────────────────────────────────────────────────

const PLAN_FILTERS = ['Tous', 'Gratuit', 'Pro', 'Enterprise'] as const;
type PlanFilter = typeof PLAN_FILTERS[number];

const PLAN_CONFIG: Record<string, { label: string; className: string }> = {
  enterprise: { label: 'Enterprise', className: 'bg-violet-600 text-white border-none' },
  pro:        { label: 'Pro',        className: 'bg-primary text-white border-none' },
  free:       { label: 'Gratuit',    className: 'bg-muted text-muted-foreground border-border' },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; className: string }> = {
  active:   { label: 'Actif',    dot: 'bg-emerald-500', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  inactive: { label: 'Inactif', dot: 'bg-slate-400',   className: 'bg-muted text-muted-foreground border-border' },
};

const PLAN_OPTIONS = [
  { value: 'free',       label: 'Gratuit',    desc: 'Accès limité, menu digital uniquement',           disabled: false },
  { value: 'pro',        label: 'Pro',        desc: 'Toutes les fonctionnalités — 29 €/mois',           disabled: false },
  { value: 'enterprise', label: 'Enterprise', desc: '🚧 En cours de développement — bientôt disponible', disabled: true  },
];

const AVATAR_COLORS = [
  'from-violet-500 to-purple-400', 'from-blue-500 to-cyan-400',
  'from-emerald-500 to-teal-400', 'from-orange-500 to-amber-400',
  'from-rose-500 to-pink-400',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const cfg = PLAN_CONFIG[plan?.toLowerCase()] ?? PLAN_CONFIG.free;
  return (
    <Badge className={cn('text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG.active;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border', cfg.className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function TenantAvatar({ name, index, size = 'md' }: { name: string; index: number; size?: 'sm' | 'md' | 'lg' }) {
  const gradient = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const sz = size === 'lg' ? 'h-14 w-14 text-base' : size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-sm';
  return (
    <div className={cn('rounded-lg flex items-center justify-center font-bold text-white bg-gradient-to-br shadow-sm flex-shrink-0', sz, gradient)}>
      {name?.substring(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Create Tenant Dialog ─────────────────────────────────────────────────────

function CreateTenantDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState('free');
  const [slugTouched, setSlugTouched] = useState(false);
  const createMutation = useCreateTenant();

  const autoSlug = (n: string) =>
    n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(autoSlug(v));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) return;
    createMutation.mutate({ name: name.trim(), slug: slug.trim(), plan }, {
      onSuccess: () => {
        toast.success(`Restaurant "${name}" créé avec succès.`);
        onClose();
        setName(''); setSlug(''); setPlan('free'); setSlugTouched(false);
      },
      onError: (e: any) => toast.error(e?.message || 'Erreur lors de la création'),
    });
  };

  const slugError = slug && !/^[a-z0-9-]+$/.test(slug)
    ? 'Minuscules, chiffres et tirets uniquement'
    : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Nouveau Restaurant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="tenant-name">Nom du restaurant</Label>
            <Input
              id="tenant-name"
              placeholder="Ex : Le Bistro Parisien"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tenant-slug">
              Slug <span className="text-muted-foreground font-normal text-xs">(URL publique)</span>
            </Label>
            <div className="flex items-center gap-1">
              <Input
                id="tenant-slug"
                placeholder="le-bistro-parisien"
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
                className={slugError ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
            </div>
            {slugError
              ? <p className="text-xs text-destructive">{slugError}</p>
              : slug && (
                <p className="text-xs text-muted-foreground font-mono">
                  {slug}.flashmenu.app
                </p>
              )}
          </div>

          <div className="space-y-1.5">
            <Label>Forfait initial</Label>
            <div className="grid gap-2">
              {PLAN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => !opt.disabled && setPlan(opt.value)}
                  disabled={opt.disabled}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                    opt.disabled
                      ? 'opacity-50 cursor-not-allowed border-dashed border-border'
                      : plan === opt.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border hover:border-border/80 hover:bg-muted/40'
                  )}
                >
                  <div className={cn(
                    'h-4 w-4 rounded-full border-2 flex-shrink-0 transition-all',
                    plan === opt.value ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                  )} />
                  <div>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !slug.trim() || !!slugError || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer le restaurant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Change Plan Dialog ───────────────────────────────────────────────────────

function ChangePlanDialog({
  tenant,
  onClose,
}: {
  tenant: any | null;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState(tenant?.plan ?? 'free');
  const updateMutation = useUpdateTenant();

  const handleSave = () => {
    if (!tenant) return;
    updateMutation.mutate({ id: tenant.id, data: { plan } }, {
      onSuccess: () => {
        toast.success(`Forfait de "${tenant.name}" mis à jour : ${plan}`);
        onClose();
      },
      onError: (e: any) => toast.error(e?.message || 'Erreur lors de la mise à jour'),
    });
  };

  if (!tenant) return null;

  return (
    <Dialog open={!!tenant} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Modifier le forfait
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <TenantAvatar name={tenant.name} index={0} size="sm" />
            <div>
              <p className="text-sm font-semibold">{tenant.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{tenant.slug}</p>
            </div>
          </div>

          <div className="grid gap-2">
            {PLAN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => !opt.disabled && setPlan(opt.value)}
                disabled={opt.disabled}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                  opt.disabled
                    ? 'opacity-50 cursor-not-allowed border-dashed border-border'
                    : plan === opt.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:bg-muted/40'
                )}
              >
                <div className={cn(
                  'h-4 w-4 rounded-full border-2 flex-shrink-0',
                  plan === opt.value ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                )} />
                <div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={plan === tenant.plan || updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tenant Detail Dialog ─────────────────────────────────────────────────────

function TenantDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: tenant, isLoading } = useTenantDetail(id);

  return (
    <Dialog open={!!id} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Détail du restaurant
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : tenant ? (
          <div className="space-y-4 py-2">
            {/* Identity */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border">
              <TenantAvatar name={tenant.name} index={0} size="lg" />
              <div className="min-w-0">
                <p className="font-bold text-lg">{tenant.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{tenant.slug}.flashmenu.app</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <PlanBadge plan={tenant.plan || 'free'} />
                  <StatusBadge status={tenant.status || 'active'} />
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Calendar, label: 'Créé le', value: safeFormat(tenant.createdAt, 'dd MMM yyyy', { locale: fr }) },
                { icon: Users,    label: 'Membres',  value: tenant.memberships?.length ?? 0 },
              ].map((row) => (
                <div key={row.label} className="rounded-lg border p-3 flex items-center gap-3">
                  <row.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="text-sm font-semibold">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Members list */}
            {tenant.memberships?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Équipe</p>
                <div className="divide-y divide-border rounded-lg border overflow-hidden">
                  {tenant.memberships.slice(0, 5).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">
                          {m.user?.name?.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                        {m.role}
                      </Badge>
                    </div>
                  ))}
                  {tenant.memberships.length > 5 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                      +{tenant.memberships.length - 5} autres membres
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">Restaurant introuvable.</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          {tenant && (
            <Button asChild>
              <a href={`https://${tenant.slug}.flashmenu.app`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir le site
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('Tous');

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [planTenant, setPlanTenant] = useState<any | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);

  const { data: tenants, isLoading, refetch } = useTenants();
  const updateMutation = useUpdateTenant();

  const filtered = useMemo(() => {
    if (!tenants) return [];
    return tenants.filter((t: any) => {
      const matchSearch =
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.slug?.toLowerCase().includes(search.toLowerCase());
      const matchPlan =
        planFilter === 'Tous' ||
        (planFilter === 'Gratuit' && (!t.plan || t.plan === 'free')) ||
        (planFilter === 'Pro' && t.plan === 'pro') ||
        (planFilter === 'Enterprise' && t.plan === 'enterprise');
      return matchSearch && matchPlan;
    });
  }, [tenants, search, planFilter]);

  const handleToggleStatus = () => {
    if (!suspendTarget) return;
    const newStatus = suspendTarget.status === 'active' ? 'inactive' : 'active';
    updateMutation.mutate(
      { id: suspendTarget.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast.success(
            newStatus === 'inactive'
              ? `"${suspendTarget.name}" suspendu.`
              : `"${suspendTarget.name}" réactivé.`
          );
          setSuspendTarget(null);
        },
        onError: (e: any) => toast.error(e?.message || 'Erreur'),
      }
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Restaurants</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestion des établissements et de leurs abonnements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isLoading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button size="sm" className="shadow-sm shadow-primary/20" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nouveau
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total restaurants"
          value={tenants?.length ?? 0}
          icon={<Store className="h-5 w-5" />}
          variant="blue"
        />
        <StatsCard
          title="Établissements actifs"
          value={tenants?.filter((t: any) => t.status === 'active').length ?? 0}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="emerald"
          subtitle="Actuellement en ligne"
        />
        <StatsCard
          title="Comptes premium"
          value={tenants?.filter((t: any) => t.plan === 'pro' || t.plan === 'enterprise').length ?? 0}
          icon={<Sparkles className="h-5 w-5" />}
          variant="purple"
        />
        <StatsCard
          title="Enterprise"
          value={tenants?.filter((t: any) => t.plan === 'enterprise').length ?? 0}
          icon={<Building2 className="h-5 w-5" />}
          variant="amber"
        />
      </div>

      {/* Table card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Nom, slug…"
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {PLAN_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setPlanFilter(f)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold transition-all',
                    planFilter === f
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="ml-auto text-xs text-muted-foreground">
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
              <p className="text-sm text-muted-foreground">Chargement des restaurants…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <AlertCircle className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="font-semibold">Aucun restaurant trouvé</p>
              <p className="text-sm text-muted-foreground mt-1">Modifiez votre recherche ou vos filtres.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Restaurant</TableHead>
                  <TableHead className="py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Forfait</TableHead>
                  <TableHead className="py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Statut</TableHead>
                  <TableHead className="py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Inscription</TableHead>
                  <TableHead className="py-3 pr-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tenant: any, i: number) => (
                  <TableRow key={tenant.id} className="group">
                    <TableCell className="pl-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <TenantAvatar name={tenant.name} index={i} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{tenant.slug}.flashmenu.app</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5"><PlanBadge plan={tenant.plan || 'free'} /></TableCell>
                    <TableCell className="py-3.5"><StatusBadge status={tenant.status || 'active'} /></TableCell>
                    <TableCell className="py-3.5 hidden md:table-cell">
                      <p className="text-sm font-medium">
                        {safeFormat(tenant.createdAt, 'dd MMM yyyy', { locale: fr })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {safeFormat(tenant.createdAt, 'HH:mm')}
                      </p>
                    </TableCell>
                    <TableCell className="py-3.5 pr-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase font-bold">Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => setDetailId(tenant.id)}>
                            <Eye className="h-3.5 w-3.5" /> Voir le détail
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-sm cursor-pointer" asChild>
                            <a href={`https://${tenant.slug}.flashmenu.app`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 text-blue-500" /> Ouvrir le site
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => setPlanTenant(tenant)}>
                            <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Modifier le forfait
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={cn(
                              'gap-2 text-sm cursor-pointer',
                              tenant.status === 'active'
                                ? 'text-destructive focus:text-destructive'
                                : 'text-emerald-600 focus:text-emerald-600'
                            )}
                            onClick={() => setSuspendTarget(tenant)}
                          >
                            {tenant.status === 'active'
                              ? <><Ban className="h-3.5 w-3.5" /> Suspendre</>
                              : <><CheckCircle2 className="h-3.5 w-3.5" /> Réactiver</>
                            }
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateTenantDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <TenantDetailDialog id={detailId} onClose={() => setDetailId(null)} />

      {/* key force le remount pour réinitialiser le state plan à chaque tenant sélectionné */}
      <ChangePlanDialog key={planTenant?.id ?? 'closed'} tenant={planTenant} onClose={() => setPlanTenant(null)} />

      <ConfirmationDialog
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleToggleStatus}
        isLoading={updateMutation.isPending}
        variant={suspendTarget?.status === 'active' ? 'destructive' : 'default'}
        title={suspendTarget?.status === 'active' ? 'Suspendre le restaurant' : 'Réactiver le restaurant'}
        description={
          suspendTarget?.status === 'active'
            ? `Voulez-vous suspendre "${suspendTarget?.name}" ? Les utilisateurs ne pourront plus se connecter.`
            : `Voulez-vous réactiver "${suspendTarget?.name}" ?`
        }
        confirmText={suspendTarget?.status === 'active' ? 'Suspendre' : 'Réactiver'}
      />
    </div>
  );
}
