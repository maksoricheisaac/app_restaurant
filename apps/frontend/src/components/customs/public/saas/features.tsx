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

const FEATURES = [
  {
    title: "Menu QR Code Dynamique",
    description: "Mettez à jour plats et prix en temps réel depuis votre dashboard, sans réimprimer vos menus.",
    icon: QrCode,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400",
    tag: "Core",
  },
  {
    title: "Commandes Mobile",
    description: "Vos clients commandent et paient directement depuis leur téléphone, sans application à installer.",
    icon: Smartphone,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    tag: "Populaire",
  },
  {
    title: "Kitchen Display System",
    description: "Les commandes s'affichent en temps réel en cuisine. Fini les bons papier perdus, finies les erreurs.",
    icon: ChefHat,
    color: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400",
    tag: "Pro",
  },
  {
    title: "Rapports & Analytiques",
    description: "Chiffre d'affaires, plats populaires, heures de pointe : des données actionnables pour décider mieux.",
    icon: BarChart3,
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    tag: "Pro",
  },
  {
    title: "Gestion des Réservations",
    description: "Carnet de réservations digital, confirmation automatique et gestion des tables en un clic.",
    icon: CalendarCheck,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
    tag: "Core",
  },
  {
    title: "Caisse & Paiements",
    description: "Encaissez en espèces, par carte ou en ligne. Tickets de caisse et clôture journalière automatique.",
    icon: CreditCard,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    tag: "Core",
  },
  {
    title: "CRM Clients",
    description: "Historique des commandes, préférences et coordonnées centralisés pour fidéliser et mieux servir.",
    icon: Users,
    color: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
    tag: "Pro",
  },
  {
    title: "Sécurité Multi-tenant",
    description: "Isolation totale entre établissements, chiffrement JWT, audit trail et contrôle d'accès par rôle.",
    icon: ShieldCheck,
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
    tag: "Enterprise",
  },
] as const

const TAG_STYLES: Record<string, string> = {
  Core:       "bg-primary/10 text-primary",
  Populaire:  "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  Pro:        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  Enterprise: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300",
}

export const SaasFeatures = () => {
  return (
    <section id="features" className="py-20 sm:py-28 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-5">
            <span className="text-xs font-bold uppercase tracking-widest">Fonctionnalités</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-4">
            Tout ce dont votre restaurant a besoin
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Flash Menu centralise tous vos outils pour que vous puissiez vous concentrer sur
            ce que vous faites de mieux : cuisiner.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${TAG_STYLES[f.tag]}`}>
                  {f.tag}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
