'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  Loader2,
  Plus,
  Printer,
  Store,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { setupService } from '@/services/restaurant.service';
import { COUNTRIES, flagEmoji } from '@/lib/countries';

// ─── Modèle du brouillon ─────────────────────────────────────────────────────
//
// Rien n'est écrit en base avant la dernière étape : l'assistant accumule les
// réponses côté client et n'envoie qu'une fois, dans une transaction unique.
// Une installation abandonnée ne laisse donc aucune trace.

interface DraftMenuItem { name: string; price: string }
interface DraftCategory { name: string; items: DraftMenuItem[] }

// ── Robustesse du mot de passe propriétaire ──────────────────────────────────
//
// Doit rester le miroir exact de `SetupOwnerDto` côté backend
// (apps/backend/src/setup/dto/setup.dto.ts). Le contrôle client n'est qu'un
// confort : c'est la validation serveur qui fait autorité.

const PASSWORD_MIN_LENGTH = 10;

const PASSWORD_RULES = [
  { label: `${PASSWORD_MIN_LENGTH} caractères minimum`, test: (p: string) => p.length >= PASSWORD_MIN_LENGTH },
  { label: 'une minuscule', test: (p: string) => /[a-z]/.test(p) },
  { label: 'une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'un chiffre', test: (p: string) => /\d/.test(p) },
  { label: 'un caractère spécial', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

interface Draft {
  superAdmin: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordConfirm: string;
    phone: string;
  };
  restaurant: {
    name: string; slogan: string; description: string; cuisineType: string;
    phone: string; email: string; address: string;
    country: string; currency: string; timezone: string;
    dineInEnabled: boolean; takeawayEnabled: boolean; deliveryEnabled: boolean;
  };
  cash: {
    defaultPaymentMethod: 'cash' | 'card' | 'online';
    taxRate: string; taxIncluded: boolean; requireCashSession: boolean;
  };
  menu: DraftCategory[];
  printing: {
    receiptPrinterName: string; kitchenPrinterName: string;
    receiptPaperWidth: string; receiptFooter: string;
    autoPrintReceipt: boolean; autoPrintKitchenTicket: boolean;
  };
}

const EMPTY_DRAFT: Draft = {
  superAdmin: { firstName: '', lastName: '', email: '', password: '', passwordConfirm: '', phone: '' },
  restaurant: {
    name: '', slogan: '', description: '', cuisineType: '',
    phone: '', email: '', address: '',
    country: 'FR', currency: 'EUR', timezone: 'Europe/Paris',
    dineInEnabled: true, takeawayEnabled: true, deliveryEnabled: false,
  },
  cash: {
    defaultPaymentMethod: 'cash',
    taxRate: '0', taxIncluded: true, requireCashSession: true,
  },
  menu: [
    { name: 'Entrées', items: [] },
    { name: 'Plats', items: [] },
    { name: 'Desserts', items: [] },
    { name: 'Boissons', items: [] },
  ],
  printing: {
    receiptPrinterName: '', kitchenPrinterName: '',
    receiptPaperWidth: '80', receiptFooter: '',
    autoPrintReceipt: false, autoPrintKitchenTicket: true,
  },
};

const ALL_STEPS = [
  { key: 'superAdmin', label: 'Super admin', icon: User },
  { key: 'restaurant', label: 'Restaurant', icon: Store },
  { key: 'cash', label: 'Caisse', icon: Wallet },
  { key: 'menu', label: 'Carte', icon: ChefHat },
  { key: 'printing', label: 'Impression', icon: Printer },
] as const;

/**
 * En reprise, l'établissement est déjà configuré : seul le compte racine a
 * disparu. Redemander la carte, la caisse et les imprimantes n'aurait aucun
 * sens — et le backend ignorerait ces réponses.
 */
const RECOVERY_STEPS = [ALL_STEPS[0]] as const;

interface SetupWizardProps {
  /** Vrai quand l'assistant ne sert qu'à recréer le compte racine perdu. */
  recovery?: boolean;
}

export function SetupWizard({ recovery = false }: SetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);

  const STEPS = recovery ? RECOVERY_STEPS : ALL_STEPS;

  const patch = <K extends keyof Draft>(key: K, value: Partial<Draft[K]>) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...value } }));

  // ── Validation par étape ───────────────────────────────────────────────────
  function stepError(index: number): string | null {
    if (index === 0) {
      const { firstName, lastName, email, password, passwordConfirm } = draft.superAdmin;
      if (!firstName.trim() || !lastName.trim()) return 'Renseignez votre nom et prénom.';
      if (!/^\S+@\S+\.\S+$/.test(email)) return 'Adresse email invalide.';
      const unmet = PASSWORD_RULES.filter((rule) => !rule.test(password));
      if (unmet.length) return `Le mot de passe doit contenir ${unmet.map((r) => r.label).join(', ')}.`;
      if (password !== passwordConfirm) return 'Les deux mots de passe ne correspondent pas.';
    }
    if (index === 1) {
      if (!draft.restaurant.name.trim()) return 'Le nom du restaurant est obligatoire.';
      const { dineInEnabled, takeawayEnabled, deliveryEnabled } = draft.restaurant;
      if (!dineInEnabled && !takeawayEnabled && !deliveryEnabled) {
        return 'Activez au moins un mode de service.';
      }
    }
    if (index === 3) {
      if (draft.menu.some((c) => !c.name.trim())) return 'Chaque catégorie doit avoir un nom.';
      if (draft.menu.some((c) => c.items.some((i) => !i.name.trim())))
        return 'Chaque plat doit avoir un nom.';
    }
    return null;
  }

  function next() {
    const error = stepError(step);
    if (error) return toast.error(error);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    for (let i = 0; i < STEPS.length; i++) {
      const error = stepError(i);
      if (error) {
        setStep(i);
        return toast.error(error);
      }
    }

    setSubmitting(true);
    try {
      const superAdmin = {
        firstName: draft.superAdmin.firstName.trim(),
        lastName: draft.superAdmin.lastName.trim(),
        email: draft.superAdmin.email.trim(),
        password: draft.superAdmin.password,
        phone: draft.superAdmin.phone.trim() || undefined,
      };

      // En reprise, on n'envoie QUE le compte : le backend laisse la
      // configuration existante intacte, et lui réexpédier un brouillon vide
      // reviendrait à proposer de l'écraser.
      await setupService.complete(
        recovery
          ? { superAdmin }
          : {
              superAdmin,
              restaurant: {
                ...draft.restaurant,
                slogan: draft.restaurant.slogan.trim() || undefined,
                description: draft.restaurant.description.trim() || undefined,
                cuisineType: draft.restaurant.cuisineType.trim() || undefined,
                phone: draft.restaurant.phone.trim() || undefined,
                email: draft.restaurant.email.trim() || undefined,
                address: draft.restaurant.address.trim() || undefined,
              },
              cash: {
                defaultPaymentMethod: draft.cash.defaultPaymentMethod,
                taxRate: Number(draft.cash.taxRate) || 0,
                taxIncluded: draft.cash.taxIncluded,
                requireCashSession: draft.cash.requireCashSession,
              },
              menu: draft.menu
                .filter((c) => c.name.trim())
                .map((c) => ({
                  name: c.name.trim(),
                  items: c.items
                    .filter((i) => i.name.trim())
                    .map((i) => ({ name: i.name.trim(), price: Number(i.price) || 0 })),
                })),
              printing: {
                receiptPrinterName: draft.printing.receiptPrinterName.trim() || undefined,
                kitchenPrinterName: draft.printing.kitchenPrinterName.trim() || undefined,
                receiptPaperWidth: Number(draft.printing.receiptPaperWidth) || 80,
                receiptFooter: draft.printing.receiptFooter.trim() || undefined,
                autoPrintReceipt: draft.printing.autoPrintReceipt,
                autoPrintKitchenTicket: draft.printing.autoPrintKitchenTicket,
              },
            },
      );

      toast.success(
        recovery
          ? 'Compte super administrateur recréé — vous reprenez la main.'
          : 'Installation terminée — bienvenue !',
      );
      // Le backend a posé les cookies de session : on entre directement.
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Échec de l'installation.");
    } finally {
      setSubmitting(false);
    }
  }

  const Current = STEPS[step].icon;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* ── Progression ── */}
      <ol className="mb-10 flex items-center justify-between gap-1">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.key} className="flex flex-1 flex-col items-center gap-2">
              <span
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary text-primary',
                  !done && !active && 'border-border text-muted-foreground',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {done ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </span>
              <span
                className={`hidden text-[11px] font-medium sm:block ${
                  active ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Current className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl text-foreground">
              {STEPS[step].label}
            </h2>
            <p className="text-sm text-muted-foreground">
              Étape {step + 1} sur {STEPS.length}
            </p>
          </div>
        </div>

        {step === 0 && <SuperAdminStep draft={draft} patch={patch} recovery={recovery} />}
        {step === 1 && <RestaurantStep draft={draft} patch={patch} />}
        {step === 2 && <CashStep draft={draft} patch={patch} />}
        {step === 3 && <MenuStep draft={draft} setDraft={setDraft} />}
        {step === 4 && <PrintingStep draft={draft} patch={patch} />}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0 || submitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {recovery
                    ? 'Recréer le compte super administrateur'
                    : "Terminer l'installation"}
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Étapes ──────────────────────────────────────────────────────────────────

type PatchFn = <K extends keyof Draft>(key: K, value: Partial<Draft[K]>) => void;

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SuperAdminStep({
  draft,
  patch,
  recovery,
}: {
  draft: Draft;
  patch: PatchFn;
  recovery: boolean;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {recovery ? (
          <>
            L&apos;établissement est déjà configuré, mais son compte super
            administrateur a disparu. Ce formulaire le recrée — rien d&apos;autre
            ne sera modifié : ni votre carte, ni votre caisse, ni votre équipe.
          </>
        ) : (
          <>
            Ce compte sera le <strong>super administrateur</strong> : le compte
            racine du logiciel. Il a tous les droits, en permanence et sans
            restriction possible, et ne peut être ni supprimé ni modifié depuis
            la gestion d&apos;équipe. C&apos;est le seul moment où il peut être
            créé.
          </>
        )}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom">
          <Input
            value={draft.superAdmin.firstName}
            onChange={(e) => patch('superAdmin', { firstName: e.target.value })}
            autoComplete="given-name"
          />
        </Field>
        <Field label="Nom">
          <Input
            value={draft.superAdmin.lastName}
            onChange={(e) => patch('superAdmin', { lastName: e.target.value })}
            autoComplete="family-name"
          />
        </Field>
      </div>
      <Field label="Adresse email">
        <Input
          type="email"
          value={draft.superAdmin.email}
          onChange={(e) => patch('superAdmin', { email: e.target.value })}
          autoComplete="email"
        />
      </Field>
      <Field label="Mot de passe">
        <Input
          type="password"
          value={draft.superAdmin.password}
          onChange={(e) => patch('superAdmin', { password: e.target.value })}
          autoComplete="new-password"
          aria-describedby="password-rules"
        />
        <ul id="password-rules" className="mt-2 grid gap-1 sm:grid-cols-2">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(draft.superAdmin.password);
            return (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 text-xs ${
                  met ? 'text-emerald-600' : 'text-muted-foreground'
                }`}
              >
                <Check className={`h-3 w-3 ${met ? 'opacity-100' : 'opacity-30'}`} aria-hidden />
                {rule.label}
              </li>
            );
          })}
        </ul>
      </Field>
      <Field label="Confirmation du mot de passe">
        <Input
          type="password"
          value={draft.superAdmin.passwordConfirm}
          onChange={(e) => patch('superAdmin', { passwordConfirm: e.target.value })}
          autoComplete="new-password"
          aria-invalid={
            draft.superAdmin.passwordConfirm.length > 0 &&
            draft.superAdmin.passwordConfirm !== draft.superAdmin.password
          }
        />
        {draft.superAdmin.passwordConfirm.length > 0 &&
          draft.superAdmin.passwordConfirm !== draft.superAdmin.password && (
            <p role="alert" className="text-xs text-destructive">
              Les deux mots de passe ne correspondent pas.
            </p>
          )}
      </Field>
      <Field label="Téléphone (optionnel)">
        <Input
          value={draft.superAdmin.phone}
          onChange={(e) => patch('superAdmin', { phone: e.target.value })}
          autoComplete="tel"
        />
      </Field>
    </div>
  );
}

function RestaurantStep({ draft, patch }: { draft: Draft; patch: PatchFn }) {
  const r = draft.restaurant;
  return (
    <div className="space-y-5">
      <Field label="Nom du restaurant">
        <Input value={r.name} onChange={(e) => patch('restaurant', { name: e.target.value })} />
      </Field>
      <Field label="Slogan (optionnel)">
        <Input
          value={r.slogan}
          onChange={(e) => patch('restaurant', { slogan: e.target.value })}
          placeholder="Cuisine de saison, faite maison"
        />
      </Field>
      <Field label="Description (optionnel)">
        <Textarea
          rows={3}
          value={r.description}
          onChange={(e) => patch('restaurant', { description: e.target.value })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type de cuisine">
          <Input
            value={r.cuisineType}
            onChange={(e) => patch('restaurant', { cuisineType: e.target.value })}
            placeholder="Bistrot français"
          />
        </Field>
        <Field label="Téléphone">
          <Input value={r.phone} onChange={(e) => patch('restaurant', { phone: e.target.value })} />
        </Field>
      </div>
      <Field label="Adresse">
        <Input value={r.address} onChange={(e) => patch('restaurant', { address: e.target.value })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Pays">
          <Select
            value={r.country}
            onValueChange={(v) => {
              const country = COUNTRIES.find((c) => c.code === v);
              patch('restaurant', {
                country: v,
                currency: country?.currency ?? r.currency,
                timezone: country?.timezones?.[0] ?? r.timezone,
              });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {flagEmoji(c.code)} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Devise">
          <Input
            value={r.currency}
            onChange={(e) => patch('restaurant', { currency: e.target.value.toUpperCase() })}
          />
        </Field>
        <Field label="Fuseau horaire">
          <Input
            value={r.timezone}
            onChange={(e) => patch('restaurant', { timezone: e.target.value })}
          />
        </Field>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">Modes de service</p>
        {([
          ['dineInEnabled', 'Sur place'],
          ['takeawayEnabled', 'À emporter'],
          ['deliveryEnabled', 'Livraison'],
        ] as const).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <Label className="text-sm font-normal">{label}</Label>
            <Switch
              checked={r[key]}
              onCheckedChange={(checked) => patch('restaurant', { [key]: checked } as any)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CashStep({ draft, patch }: { draft: Draft; patch: PatchFn }) {
  const c = draft.cash;
  return (
    <div className="space-y-5">
      <Field label="Moyen de paiement par défaut">
        <Select
          value={c.defaultPaymentMethod}
          onValueChange={(v) => patch('cash', { defaultPaymentMethod: v as any })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Espèces</SelectItem>
            <SelectItem value="card">Carte bancaire</SelectItem>
            <SelectItem value="online">En ligne</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Taux de TVA (%)">
        <Input
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={c.taxRate}
          onChange={(e) => patch('cash', { taxRate: e.target.value })}
        />
      </Field>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label className="text-sm font-normal">Prix affichés TTC</Label>
            <p className="text-xs text-muted-foreground">
              Désactivez si la taxe s&apos;ajoute à l&apos;encaissement.
            </p>
          </div>
          <Switch
            checked={c.taxIncluded}
            onCheckedChange={(checked) => patch('cash', { taxIncluded: checked })}
          />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label className="text-sm font-normal">Session de caisse obligatoire</Label>
            <p className="text-xs text-muted-foreground">
              Exige l&apos;ouverture d&apos;une session avant tout encaissement en espèces.
            </p>
          </div>
          <Switch
            checked={c.requireCashSession}
            onCheckedChange={(checked) => patch('cash', { requireCashSession: checked })}
          />
        </div>
      </div>
    </div>
  );
}

function MenuStep({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
}) {
  const setMenu = (menu: DraftCategory[]) => setDraft((d) => ({ ...d, menu }));

  const updateCategory = (i: number, patch: Partial<DraftCategory>) =>
    setMenu(draft.menu.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const updateItem = (ci: number, ii: number, patch: Partial<DraftMenuItem>) =>
    updateCategory(ci, {
      items: draft.menu[ci].items.map((it, idx) =>
        idx === ii ? { ...it, ...patch } : it,
      ),
    });

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Posez les grandes catégories de votre carte. Vous pourrez tout compléter
        ensuite depuis l&apos;administration — rien n&apos;est figé ici.
      </p>

      <div className="space-y-4">
        {draft.menu.map((category, ci) => (
          <div key={ci} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <Input
                value={category.name}
                onChange={(e) => updateCategory(ci, { name: e.target.value })}
                placeholder="Nom de la catégorie"
                className="font-medium"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMenu(draft.menu.filter((_, idx) => idx !== ci))}
                aria-label="Supprimer la catégorie"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            {category.items.length > 0 && (
              <div className="mt-3 space-y-2">
                {category.items.map((item, ii) => (
                  <div key={ii} className="flex items-center gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(ci, ii, { name: e.target.value })}
                      placeholder="Nom du plat"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(ci, ii, { price: e.target.value })}
                      placeholder="Prix"
                      className="w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateCategory(ci, {
                          items: category.items.filter((_, idx) => idx !== ii),
                        })
                      }
                      aria-label="Supprimer le plat"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() =>
                updateCategory(ci, { items: [...category.items, { name: '', price: '' }] })
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Ajouter un plat
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setMenu([...draft.menu, { name: '', items: [] }])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Ajouter une catégorie
      </Button>
    </div>
  );
}

function PrintingStep({ draft, patch }: { draft: Draft; patch: PatchFn }) {
  const p = draft.printing;
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Ces réglages sont facultatifs et modifiables à tout moment depuis les
        paramètres.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Imprimante ticket">
          <Input
            value={p.receiptPrinterName}
            onChange={(e) => patch('printing', { receiptPrinterName: e.target.value })}
            placeholder="Caisse-80mm"
          />
        </Field>
        <Field label="Imprimante cuisine" hint="Vide = même imprimante que les tickets.">
          <Input
            value={p.kitchenPrinterName}
            onChange={(e) => patch('printing', { kitchenPrinterName: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Largeur du papier (mm)">
        <Select
          value={p.receiptPaperWidth}
          onValueChange={(v) => patch('printing', { receiptPaperWidth: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="58">58 mm</SelectItem>
            <SelectItem value="80">80 mm</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Pied de ticket (optionnel)">
        <Textarea
          rows={2}
          value={p.receiptFooter}
          onChange={(e) => patch('printing', { receiptFooter: e.target.value })}
          placeholder="Merci de votre visite !"
        />
      </Field>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal">Imprimer le ticket automatiquement</Label>
          <Switch
            checked={p.autoPrintReceipt}
            onCheckedChange={(checked) => patch('printing', { autoPrintReceipt: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal">Envoyer le bon en cuisine automatiquement</Label>
          <Switch
            checked={p.autoPrintKitchenTicket}
            onCheckedChange={(checked) => patch('printing', { autoPrintKitchenTicket: checked })}
          />
        </div>
      </div>
    </div>
  );
}
