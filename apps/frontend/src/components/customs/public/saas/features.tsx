import {
  QrCode,
  Smartphone,
  BarChart3,
  Users,
  ChefHat,
  ShieldCheck,
  CreditCard,
  CalendarCheck,
} from "lucide-react"
import { SectionHeading } from "./section-heading"
import { Stagger } from "@/components/motion/stagger"

const FEATURES = [
  {
    title: "Menu QR dynamique",
    description: "Mettez à jour plats et prix en temps réel depuis votre dashboard, sans jamais réimprimer.",
    icon: QrCode,
    tag: "Essentiel",
  },
  {
    title: "Commandes mobiles",
    description: "Vos clients commandent et paient depuis leur téléphone, sans application à installer.",
    icon: Smartphone,
    tag: "Populaire",
  },
  {
    title: "Kitchen Display System",
    description: "Les commandes s'affichent en direct en cuisine. Fini les bons papier perdus, finies les erreurs.",
    icon: ChefHat,
    tag: "Pro",
  },
  {
    title: "Rapports & analytics",
    description: "Chiffre d'affaires, plats populaires, heures de pointe : des données actionnables pour décider mieux.",
    icon: BarChart3,
    tag: "Pro",
  },
  {
    title: "Réservations",
    description: "Carnet digital, confirmation automatique et gestion des tables en un clic.",
    icon: CalendarCheck,
    tag: "Essentiel",
  },
  {
    title: "Caisse & paiements",
    description: "Espèces, carte ou en ligne. Tickets et clôture journalière générés automatiquement.",
    icon: CreditCard,
    tag: "Essentiel",
  },
  {
    title: "CRM clients",
    description: "Historique, préférences et coordonnées centralisés pour fidéliser et mieux servir.",
    icon: Users,
    tag: "Pro",
  },
  {
    title: "Sécurité multi-tenant",
    description: "Isolation totale entre établissements, chiffrement JWT, audit trail et contrôle par rôle.",
    icon: ShieldCheck,
    tag: "Entreprise",
  },
] as const

const TAG_STYLES: Record<string, string> = {
  Essentiel:  "text-primary bg-primary/10",
  Populaire:  "text-info bg-info/10",
  Pro:        "text-warning bg-warning/12",
  Entreprise: "text-muted-foreground bg-muted",
}

export const SaasFeatures = () => {
  return (
    <section id="features" className="relative py-24 sm:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <SectionHeading
          eyebrow="Tout-en-un"
          title={<>Chaque service de votre restaurant, <span className="font-display-italic text-gradient-warm">au même endroit</span></>}
          description="Flash Menu réunit vos outils pour que vous puissiez vous concentrer sur ce que vous faites de mieux : cuisiner et accueillir."
        />

        <Stagger className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-3xl overflow-hidden border border-border">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative bg-card p-7 flex flex-col gap-5 transition-colors duration-300 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                  <f.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${TAG_STYLES[f.tag]}`}>
                  {f.tag}
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
