'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail, Phone, MessageSquare, Send, Loader2, CheckCircle2,
  Zap, Shield, HeartHandshake, ChevronDown, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSendMessage } from '@/hooks/api/useContact';
import { SectionHeading } from '@/components/customs/public/saas/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { TextReveal } from '@/components/motion/text-reveal';
import { Stagger } from '@/components/motion/stagger';

/* ─────────────────────────── data ─────────────────────────── */

const CONTACT_CHANNELS = [
  { icon: Mail,          label: 'Email',          value: 'hello@flashmenu.app',   hint: 'Réponse sous 24 h',      tone: 'text-info bg-info/10' },
  { icon: Phone,         label: 'Téléphone',      value: '+33 1 23 45 67 89',     hint: 'Lun–Ven, 9h–18h',        tone: 'text-success bg-success/10' },
  { icon: MessageSquare, label: 'Chat en direct', value: 'flashmenu.app/chat',    hint: 'Disponible maintenant',  tone: 'text-primary bg-primary/10' },
];

const SUBJECTS = [
  { value: 'demo',        label: 'Demande de démonstration' },
  { value: 'trial',       label: "Questions sur l'essai gratuit" },
  { value: 'support',     label: 'Support technique' },
  { value: 'billing',     label: 'Facturation & abonnement' },
  { value: 'enterprise',  label: 'Devis Enterprise / Multi-sites' },
  { value: 'partnership', label: 'Partenariat' },
  { value: 'other',       label: 'Autre' },
];

const FAQS = [
  { q: "Combien de temps dure l'essai gratuit ?", a: '14 jours complets, sans carte de crédit requise. Accès à toutes les fonctionnalités Pro.' },
  { q: 'Puis-je changer de plan à tout moment ?', a: 'Oui, vous pouvez upgrader ou downgrader votre plan à n\'importe quel moment depuis votre tableau de bord.' },
  { q: "Proposez-vous un accompagnement à l'onboarding ?", a: 'Oui, chaque nouveau restaurant Pro ou Enterprise bénéficie d\'une session d\'onboarding en visio avec notre équipe.' },
  { q: 'Les données de mon restaurant sont-elles sécurisées ?', a: 'Absolument. Vos données sont hébergées en Europe, chiffrées en transit et au repos, conformes au RGPD.' },
];

const TRUST_ITEMS = [
  { icon: Zap,            text: 'Réponse en moins de 24 h' },
  { icon: Shield,         text: 'Données sécurisées RGPD' },
  { icon: HeartHandshake, text: 'Accompagnement humain' },
];

/* ─────────────────────────── FAQ accordion ─────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-accent/40 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-all duration-300', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── contact form ───────────────────── */

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    company: '', subject: '', message: '',
  });

  const { mutateAsync: sendMessage, isPending } = useSendMessage();
  const set = (field: string, val: string) => setForm((p) => ({ ...p, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.message) {
      toast.info('Veuillez remplir les champs obligatoires.');
      return;
    }
    try {
      await sendMessage(form);
      setSent(true);
    } catch {
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center animate-slide-up">
        <div className="h-16 w-16 rounded-full bg-success/12 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h3 className="font-display text-2xl text-foreground">Message envoyé</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Notre équipe vous répondra dans les plus brefs délais, généralement sous 24 h.
        </p>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSent(false)}>
          Envoyer un autre message
        </Button>
      </div>
    );
  }

  const labelCls = 'text-sm font-medium text-foreground';
  const inputCls = 'h-11 rounded-xl bg-background';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className={labelCls}>Prénom <span className="text-primary">*</span></Label>
          <Input id="firstName" autoComplete="given-name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Marie" required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className={labelCls}>Nom</Label>
          <Input id="lastName" autoComplete="family-name" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Dupont" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className={labelCls}>Email professionnel <span className="text-primary">*</span></Label>
          <Input id="email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="marie@restaurant.fr" required className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company" className={labelCls}>Établissement</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="company" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Le Bistrot Parisien" className={cn(inputCls, 'pl-9')} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className={labelCls}>Sujet</Label>
        <Select value={form.subject} onValueChange={(v) => set('subject', v)}>
          <SelectTrigger className="h-11 rounded-xl bg-background w-full">
            <SelectValue placeholder="Sélectionnez un sujet…" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message" className={labelCls}>Message <span className="text-primary">*</span></Label>
        <Textarea
          id="message"
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Décrivez votre projet ou votre question…"
          required
          rows={5}
          className="rounded-xl bg-background resize-none"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/20">
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Envoyer le message<Send className="ml-2 h-4 w-4" /></>}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        En envoyant, vous acceptez notre politique de confidentialité. Pas de spam, jamais.
      </p>
    </form>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

export default function ContactPageClient() {
  return (
    <div className="bg-background">

      {/* Hero */}
      <section className="relative overflow-hidden pt-14 pb-10 sm:pt-20 sm:pb-14">
        <div className="warm-aura absolute inset-0 -z-10" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <Reveal as="div" y={12} className="inline-flex items-center gap-2.5 mb-6">
            <span className="h-px w-8 bg-primary/60" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Contact</span>
            <span className="h-px w-8 bg-primary/60" />
          </Reveal>
          <TextReveal as="h1" className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] lg:leading-[1.03] text-foreground text-balance">
            Parlons de votre{' '}
            <span className="font-display-italic text-gradient-warm">restaurant</span>
          </TextReveal>
          <Reveal as="p" delay={0.15} className="text-lg text-muted-foreground max-w-xl mx-auto mt-5">
            Une démo, une question sur l’essai, un devis Enterprise ? Notre équipe vous
            répond, humainement, sous 24 heures.
          </Reveal>
        </div>
      </section>

      {/* Channels + form */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">

            {/* Colonne infos */}
            <div className="lg:col-span-2 space-y-4">
              <Stagger className="space-y-4">
                {CONTACT_CHANNELS.map((c) => (
                  <div key={c.label} className="flex items-start gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow duration-300">
                    <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', c.tone)}>
                      <c.icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{c.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.hint}</p>
                    </div>
                  </div>
                ))}
              </Stagger>

              <Reveal as="div" delay={0.1} className="bg-foreground text-background rounded-2xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-4">Pourquoi nous écrire</p>
                <ul className="space-y-3">
                  {TRUST_ITEMS.map((t) => (
                    <li key={t.text} className="flex items-center gap-3 text-sm text-background/80">
                      <span className="h-8 w-8 rounded-lg bg-background/10 flex items-center justify-center shrink-0">
                        <t.icon className="h-4 w-4 text-primary" />
                      </span>
                      {t.text}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            {/* Colonne formulaire */}
            <Reveal as="div" x={30} y={0} className="lg:col-span-3">
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 bg-card">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="Questions rapides" title={<>Vous avez peut-être <span className="font-display-italic text-gradient-warm">déjà la réponse</span></>} />
          <Stagger className="mt-12 space-y-3" stagger={0.06} y={14}>
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </Stagger>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Envie de voir le produit en action ?{' '}
            <Link href="/auth/register" className="text-primary font-semibold hover:underline">
              Démarrez votre essai gratuit
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
