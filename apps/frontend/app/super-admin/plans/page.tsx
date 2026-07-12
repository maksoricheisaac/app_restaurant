'use client';

import { useState, useMemo } from 'react';
import {
  Zap, Sparkles, Building2, Check, Plus, Users, TrendingUp, ArrowUpRight,
  MoreVertical, Pencil, Trash2, Power, Loader2, Eye, EyeOff, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/stats-card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { cn } from '@/lib/utils';
import { useBillingStats } from '@/hooks/api/useDashboard';
import {
  useAdminPlans, useCreatePlan, useUpdatePlan, useDeletePlan, useSetPlanActive,
} from '@/hooks/api/usePlans';
import { FEATURE_LABELS, formatLimit, currencySymbol } from '@/config/plans';
import type { AdminPlan, PlanWriteInput } from '@/services/plans.service';
import { toast } from 'sonner';

function planIcon(key: string) {
  if (key === 'enterprise') return Building2;
  if (key === 'pro') return Sparkles;
  return Zap;
}

// ─── Champ de limite (nombre ou « illimité ») ───────────────────────────────

function LimitField({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  const unlimited = value < 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={unlimited}
            onChange={(e) => onChange(e.target.checked ? -1 : 0)}
            className="h-3 w-3 accent-primary"
          />
          Illimité
        </label>
      </div>
      <Input
        type="number"
        min={0}
        disabled={unlimited}
        value={unlimited ? '' : value}
        placeholder={unlimited ? 'Illimité' : '0'}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9"
      />
    </div>
  );
}

// ─── Dialogue création / édition ────────────────────────────────────────────

const EMPTY: PlanWriteInput = {
  key: '', name: '', tagline: '', description: '',
  monthlyPrice: 0, annualPrice: 0, currency: 'EUR',
  maxMenuItems: -1, maxTables: -1, maxStaffMembers: -1, maxMonthlyOrders: -1,
  features: {}, highlights: [], badge: '', isActive: true, isPublic: true, sortOrder: 0,
};

function PlanFormDialog({
  open, onClose, plan,
}: { open: boolean; onClose: () => void; plan: AdminPlan | null }) {
  const isEdit = !!plan;
  // Le parent remonte ce composant via `key` → l'initialiseur de state suffit
  // (pas d'effet nécessaire pour synchroniser sur `plan`).
  const [form, setForm] = useState<PlanWriteInput>(() =>
    plan
      ? {
          key: plan.key, name: plan.name, tagline: plan.tagline ?? '',
          description: plan.description ?? '', monthlyPrice: plan.monthlyPrice,
          annualPrice: plan.annualPrice, currency: plan.currency,
          maxMenuItems: plan.maxMenuItems, maxTables: plan.maxTables,
          maxStaffMembers: plan.maxStaffMembers, maxMonthlyOrders: plan.maxMonthlyOrders,
          features: { ...plan.features }, highlights: [...plan.highlights],
          badge: plan.badge ?? '', isActive: plan.isActive, isPublic: plan.isPublic,
          sortOrder: plan.sortOrder,
        }
      : EMPTY,
  );
  const createMut = useCreatePlan();
  const updateMut = useUpdatePlan();
  const saving = createMut.isPending || updateMut.isPending;

  const set = (patch: Partial<PlanWriteInput>) => setForm((f) => ({ ...f, ...patch }));
  const toggleFeature = (fk: string) =>
    set({ features: { ...(form.features ?? {}), [fk]: !form.features?.[fk] } });

  const isSystemFree = plan?.key === 'free';

  const handleSubmit = () => {
    if (!form.key?.trim() || !form.name?.trim()) {
      toast.error('La clé et le nom sont requis');
      return;
    }
    const payload: PlanWriteInput = {
      ...form,
      tagline: form.tagline || undefined,
      description: form.description || undefined,
      badge: form.badge || undefined,
      highlights: (form.highlights ?? []).filter((h) => h.trim()),
    };
    const onOk = (verb: string) => {
      toast.success(`Plan « ${form.name} » ${verb}.`);
      onClose();
    };
    if (isEdit && plan) {
      updateMut.mutate({ id: plan.id, data: payload }, {
        onSuccess: () => onOk('mis à jour'),
        onError: (e: any) => toast.error(e?.message || 'Erreur'),
      });
    } else {
      createMut.mutate(payload, {
        onSuccess: () => onOk('créé'),
        onError: (e: any) => toast.error(e?.message || 'Erreur'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {isEdit ? `Modifier « ${plan?.name} »` : 'Nouveau plan'}
          </DialogTitle>
          <DialogDescription>
            Prix, limites et fonctionnalités appliqués immédiatement à toute la plateforme.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Identité */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Clé (identifiant)</Label>
              <Input
                value={form.key ?? ''}
                disabled={isSystemFree}
                placeholder="pro"
                onChange={(e) => set({ key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="h-9 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nom affiché</Label>
              <Input value={form.name ?? ''} placeholder="Pro" onChange={(e) => set({ name: e.target.value })} className="h-9" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Accroche</Label>
              <Input value={form.tagline ?? ''} placeholder="Restaurants 10–50 tables" onChange={(e) => set({ tagline: e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Badge (optionnel)</Label>
              <Input value={form.badge ?? ''} placeholder="Le plus populaire" onChange={(e) => set({ badge: e.target.value })} className="h-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={form.description ?? ''} placeholder="Tout ce qu'il faut pour opérer à plein régime." onChange={(e) => set({ description: e.target.value })} className="h-9" />
          </div>

          {/* Tarifs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Prix mensuel</Label>
              <Input type="number" min={0} value={form.monthlyPrice ?? 0} onChange={(e) => set({ monthlyPrice: Number(e.target.value) })} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prix annuel /mois</Label>
              <Input type="number" min={0} value={form.annualPrice ?? 0} onChange={(e) => set({ annualPrice: Number(e.target.value) })} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Devise</Label>
              <Input value={form.currency ?? 'EUR'} onChange={(e) => set({ currency: e.target.value.toUpperCase().slice(0, 8) })} className="h-9" />
            </div>
          </div>

          {/* Limites */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Limites (quotas)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <LimitField label="Articles menu" value={form.maxMenuItems ?? -1} onChange={(v) => set({ maxMenuItems: v })} />
              <LimitField label="Tables" value={form.maxTables ?? -1} onChange={(v) => set({ maxTables: v })} />
              <LimitField label="Staff" value={form.maxStaffMembers ?? -1} onChange={(v) => set({ maxStaffMembers: v })} />
              <LimitField label="Commandes/mois" value={form.maxMonthlyOrders ?? -1} onChange={(v) => set({ maxMonthlyOrders: v })} />
            </div>
          </div>

          {/* Fonctionnalités */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fonctionnalités incluses</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(FEATURE_LABELS).map(([fk, label]) => (
                <button
                  key={fk}
                  type="button"
                  onClick={() => toggleFeature(fk)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-all',
                    form.features?.[fk]
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:bg-muted/40',
                  )}
                >
                  <div className={cn('h-4 w-4 rounded flex items-center justify-center border', form.features?.[fk] ? 'bg-primary border-primary' : 'border-muted-foreground/40')}>
                    {form.features?.[fk] && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Points forts (marketing) */}
          <div className="space-y-1.5">
            <Label className="text-xs">Points forts (un par ligne — affichés sur Pricing / onboarding)</Label>
            <textarea
              value={(form.highlights ?? []).join('\n')}
              onChange={(e) => set({ highlights: e.target.value.split('\n') })}
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
              placeholder={'Commandes illimitées\n10 tables + QR codes\nKitchen Display System'}
            />
          </div>

          {/* Visibilité */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Actif</p>
                <p className="text-[11px] text-muted-foreground">Souscriptible</p>
              </div>
              <Switch checked={form.isActive ?? true} onCheckedChange={(v) => set({ isActive: v })} disabled={isSystemFree} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Public</p>
                <p className="text-[11px] text-muted-foreground">Visible pricing/onboarding</p>
              </div>
              <Switch checked={form.isPublic ?? true} onCheckedChange={(v) => set({ isPublic: v })} />
            </div>
          </div>

          <div className="space-y-1.5 max-w-[8rem]">
            <Label className="text-xs">Ordre d&apos;affichage</Label>
            <Input type="number" value={form.sortOrder ?? 0} onChange={(e) => set({ sortOrder: Number(e.target.value) })} className="h-9" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? 'Enregistrer' : 'Créer le plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { data: plans, isLoading } = useAdminPlans();
  const { data: billing } = useBillingStats();
  const setActiveMut = useSetPlanActive();
  const deleteMut = useDeletePlan();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPlan | null>(null);

  // Comptes réels et MRR par plan — agrégés côté serveur (tous les tenants).
  const stats = useMemo(() => {
    const countByKey: Record<string, number> = {};
    (billing?.breakdown ?? []).forEach((b) => { countByKey[b.key] = b.count; });
    return {
      countByKey,
      mrr: billing?.mrr ?? 0,
      paid: billing?.payingTenants ?? 0,
      conversion: billing?.conversion ?? 0,
    };
  }, [billing]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: AdminPlan) => { setEditing(p); setFormOpen(true); };

  const handleToggleActive = (p: AdminPlan) => {
    setActiveMut.mutate({ id: p.id, isActive: !p.isActive }, {
      onSuccess: () => toast.success(`« ${p.name} » ${p.isActive ? 'désactivé' : 'activé'}.`),
      onError: (e: any) => toast.error(e?.message || 'Erreur'),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success(`Plan « ${deleteTarget.name} » supprimé.`); setDeleteTarget(null); },
      onError: (e: any) => { toast.error(e?.message || 'Suppression impossible'); setDeleteTarget(null); },
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Forfaits</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez les offres d&apos;abonnement — prix, limites et fonctionnalités, pilotés par les données.
          </p>
        </div>
        <Button size="sm" className="gap-2 shadow-sm shadow-primary/20" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nouveau plan
        </Button>
      </div>

      {/* MRR Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="MRR Total" value={`${stats.mrr.toLocaleString('fr-FR')} €`} icon={<TrendingUp className="h-5 w-5" />} variant="green" subtitle="Revenu mensuel récurrent" />
        <StatsCard title="Abonnés payants" value={stats.paid} icon={<Users className="h-5 w-5" />} variant="blue" subtitle="Comptes sur un plan payant" />
        <StatsCard title="Taux de conversion" value={`${stats.conversion} %`} icon={<ArrowUpRight className="h-5 w-5" />} variant="purple" subtitle="Gratuit → Payant" />
      </div>

      {/* Plan cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(plans ?? []).map((plan) => {
            const Icon = planIcon(plan.key);
            const count = stats.countByKey[plan.key] ?? 0;
            const mrr = (plan.monthlyPrice || 0) * count;
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative bg-card rounded-2xl border shadow-sm p-5 flex flex-col gap-4 transition-shadow hover:shadow-md',
                  plan.badge ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border',
                  !plan.isActive && 'opacity-70',
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm uppercase tracking-wide">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{plan.name}</p>
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{plan.key}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.tagline ?? plan.description}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(plan)}>
                        <Pencil className="h-3.5 w-3.5" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleToggleActive(plan)} disabled={plan.key === 'free'}>
                        <Power className="h-3.5 w-3.5" /> {plan.isActive ? 'Désactiver' : 'Activer'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(plan)}
                        disabled={plan.key === 'free'}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Prix + badges d'état */}
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">
                      {plan.monthlyPrice === 0 ? 'Gratuit' : `${plan.monthlyPrice} ${currencySymbol(plan.currency)}`}
                    </span>
                    {plan.monthlyPrice > 0 && <span className="text-sm text-muted-foreground">/ mois</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={plan.isActive ? 'secondary' : 'outline'} className="text-[10px] gap-1">
                      <Power className="h-2.5 w-2.5" /> {plan.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {plan.isPublic ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                      {plan.isPublic ? 'Public' : 'Privé'}
                    </Badge>
                  </div>
                </div>

                {/* Limites */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ['Articles', plan.maxMenuItems],
                    ['Tables', plan.maxTables],
                    ['Staff', plan.maxStaffMembers],
                    ['Cmd/mois', plan.maxMonthlyOrders],
                  ].map(([label, val]) => (
                    <div key={label as string} className="rounded-lg bg-muted border border-border px-2.5 py-1.5">
                      <span className="font-semibold">{formatLimit(val as number)}</span>
                      <span className="text-muted-foreground ml-1">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Mini stats réelles */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                  <div>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Restaurants</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{mrr === 0 ? '—' : `${mrr.toLocaleString('fr-FR')} €`}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">MRR</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* key force le remount → réinit du formulaire à chaque plan édité */}
      <PlanFormDialog
        key={editing?.id ?? 'create'}
        open={formOpen}
        plan={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleteMut.isPending}
        variant="destructive"
        title="Supprimer le plan"
        description={`Voulez-vous supprimer le plan « ${deleteTarget?.name} » ? Impossible s'il est encore souscrit par des restaurants.`}
        confirmText="Supprimer"
      />
    </div>
  );
}
