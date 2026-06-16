'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import {
  Mail, Phone, MessageSquare, ArrowRight, Send, Loader2,
  CheckCircle2, MapPin, Clock, Zap, Shield, HeartHandshake,
  ChevronDown, ChevronUp, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useSendMessage } from '@/hooks/api/useContact';

/* ─────────────────────────── data ─────────────────────────── */

const CONTACT_CHANNELS = [
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@flashmenu.app',
    hint: 'Réponse sous 24 h',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Phone,
    label: 'Téléphone',
    value: '+33 1 23 45 67 89',
    hint: 'Lun–Ven, 9h–18h',
    color: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
  {
    icon: MessageSquare,
    label: 'Chat en direct',
    value: 'flashmenu.app/chat',
    hint: 'Disponible maintenant',
    color: 'bg-primary/10 text-primary',
  },
];

const SUBJECTS = [
  { value: 'demo', label: '📅 Demande de démonstration' },
  { value: 'trial', label: '🚀 Questions sur l\'essai gratuit' },
  { value: 'support', label: '🛠️ Support technique' },
  { value: 'billing', label: '💳 Facturation & abonnement' },
  { value: 'enterprise', label: '🏢 Devis Enterprise / Multi-sites' },
  { value: 'partnership', label: '🤝 Partenariat' },
  { value: 'other', label: '💬 Autre' },
];

const FAQS = [
  {
    q: 'Combien de temps dure l\'essai gratuit ?',
    a: '14 jours complets, sans carte de crédit requise. Accès à toutes les fonctionnalités Pro.',
  },
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui, vous pouvez upgrader ou downgrader votre plan à n\'importe quel moment depuis votre tableau de bord.',
  },
  {
    q: 'Proposez-vous un accompagnement à l\'onboarding ?',
    a: 'Oui, chaque nouveau restaurant Pro ou Enterprise bénéficie d\'une session d\'onboarding en visio avec notre équipe.',
  },
  {
    q: 'Les données de mon restaurant sont-elles sécurisées ?',
    a: 'Absolument. Vos données sont hébergées en Europe, chiffrées en transit et au repos, conformes au RGPD.',
  },
];

const TRUST_ITEMS = [
  { icon: Zap,           text: 'Réponse en moins de 24h' },
  { icon: Shield,        text: 'Données sécurisées RGPD' },
  { icon: HeartHandshake, text: 'Accompagnement humain' },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/* ─────────────────────────── FAQ accordion ─────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-border rounded-xl overflow-hidden cursor-pointer"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/40 transition-colors">
        <span className="text-sm font-semibold text-foreground">{q}</span>
        {open
          ? <ChevronUp   className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/20">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── contact form ───────────────────── */

function ContactForm() {
  const [sent, setSent]   = useState(false);
  const [form, setForm]   = useState({
    firstName: '', lastName: '', email: '', phone: '',
    company: '', subject: '', message: '',
  });

  const { mutateAsync: sendMessage, isPending } = useSendMessage();

  const set = (field: string, val: string) =>
    setForm((p) => ({ ...p, [field]: val }));

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
      toast.error('Erreur lors de l\'envoi. Veuillez réessayer.');
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-16 text-center"
      >
        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Message envoyé !</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Notre équipe vous répondra dans les plus brefs délais, généralement sous 24 h.
        </p>
        <Button variant="outline" size="sm" onClick={() => setSent(false)}>
          Envoyer un autre message
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prénom <span className="text-primary">*</span>
          </Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            placeholder="Marie"
            required
            className="h-11 rounded-xl border-border/70 focus-visible:ring-primary/40 focus-visible:border-primary"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nom <span className="text-primary">*</span>
          </Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            placeholder="Dupont"
            required
            className="h-11 rounded-xl border-border/70 focus-visible:ring-primary/40 focus-visible:border-primary"
          />
        </div>
      </div>

      {/* Email + Entreprise */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email professionnel <span className="text-primary">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="marie@restaurant.fr"
            required
            className="h-11 rounded-xl border-border/70 focus-visible:ring-primary/40 focus-visible:border-primary"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Établissement
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="company"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="Le Bistrot Parisien"
              className="h-11 pl-9 rounded-xl border-border/70 focus-visible:ring-primary/40 focus-visible:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Sujet */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sujet
        </Label>
        <Select value={form.subject} onValueChange={(v) => set('subject', v)}>
          <SelectTrigger className="h-11 rounded-xl border-border/70 focus:ring-primary/40 focus:border-primary w-full">
            <SelectValue placeholder="Sélectionnez un sujet…" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Message <span className="text-primary">*</span>
        </Label>
        <Textarea
          id="message"
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Décrivez votre projet ou votre question…"
          required
          rows={5}
          className="rounded-xl border-border/70 focus-visible:ring-primary/40 focus-visible:border-primary resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        className="w-full h-12 rounded-xl font-semibold shadow-md shadow-primary/20 gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi en cours…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Envoyer le message
          </>
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        En envoyant ce formulaire, vous acceptez notre{' '}
        <Link href="#" className="underline hover:text-foreground transition-colors">
          politique de confidentialité
        </Link>
        .
      </p>
    </form>
  );
}

/* ─────────────────────────── main page ─────────────────────── */

export default function ContactPageClient() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
        {/* Blobs décoratifs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-primary/6 blur-3xl" />
          <div className="absolute top-20 -left-24 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />
        </div>

        <motion.div
          className="mx-auto max-w-3xl px-4 sm:px-6 text-center"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
              <MessageSquare className="h-3.5 w-3.5" />
              On est là pour vous aider
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-5"
          >
            Parlons de votre{' '}
            <span className="text-primary">restaurant</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Démonstration, support technique, devis Enterprise ou simple question —
            notre équipe répond sous 24 h, jours ouvrés.
          </motion.p>

          {/* Trust bar */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-5 text-sm text-muted-foreground"
          >
            {TRUST_ITEMS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Contact channels ── */}
      <section className="py-6 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {CONTACT_CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <motion.div
                  key={ch.label}
                  variants={fadeUp}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs hover:shadow-sm transition-shadow"
                >
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${ch.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      {ch.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{ch.value}</p>
                    <p className="text-[11px] text-muted-foreground">{ch.hint}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Form + Info ── */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">

            {/* Form — 3 cols */}
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-2xl border border-border bg-card p-7 sm:p-10 shadow-sm">
                <div className="mb-7">
                  <span className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-3">
                    <Send className="h-3 w-3" />
                    Formulaire de contact
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Envoyez-nous un message
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Tous les champs marqués d'un <span className="text-primary font-semibold">*</span> sont obligatoires.
                  </p>
                </div>
                <ContactForm />
              </div>
            </motion.div>

            {/* Info + FAQ — 2 cols */}
            <motion.div
              className="lg:col-span-2 flex flex-col gap-6"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >

              {/* Infos pratiques */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
                <h3 className="text-base font-bold text-foreground">Informations pratiques</h3>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Horaires support</p>
                    <p className="text-xs text-muted-foreground">Lundi – Vendredi, 9h – 18h (CET)</p>
                    <p className="text-xs text-muted-foreground">Urgences : 24/7 via chat</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Siège social</p>
                    <p className="text-xs text-muted-foreground">12 rue de la Gaîté</p>
                    <p className="text-xs text-muted-foreground">75014 Paris, France</p>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                <h3 className="text-base font-bold text-foreground mb-4">Questions fréquentes</h3>
                <div className="space-y-2">
                  {FAQS.map((faq) => (
                    <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-primary px-8 py-12 sm:px-14 sm:py-16 text-center text-primary-foreground shadow-xl shadow-primary/30 relative overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            </div>

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-4">
                <Zap className="h-3 w-3" />
                Essai gratuit 14 jours
              </span>
              <h2 className="text-3xl sm:text-4xl font-black mb-3">
                Prêt à digitaliser votre restaurant ?
              </h2>
              <p className="text-primary-foreground/80 text-base mb-8 max-w-lg mx-auto">
                Lancez-vous sans carte de crédit. Configurez votre restaurant en moins de 10 minutes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg h-12 px-6 rounded-xl gap-2"
                >
                  <Link href="/auth/register">
                    Commencer gratuitement
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="text-primary-foreground hover:bg-white/10 font-semibold h-12 px-6 rounded-xl"
                >
                  <Link href="/pricing">Voir les tarifs</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
