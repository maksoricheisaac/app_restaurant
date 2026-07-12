import { ScanLine, MonitorSmartphone, LineChart } from "lucide-react"
import { SectionHeading } from "./section-heading"
import { Stagger } from "@/components/motion/stagger"

const STEPS = [
  {
    step: "01",
    title: "Créez votre menu digital",
    description:
      "Importez vos plats, prix et photos en quelques minutes. Flash Menu génère automatiquement un QR code unique pour chaque table.",
    icon: ScanLine,
  },
  {
    step: "02",
    title: "Vos clients commandent",
    description:
      "Ils scannent, parcourent le menu et commandent depuis leur téléphone. La commande arrive instantanément en cuisine, sans erreur.",
    icon: MonitorSmartphone,
  },
  {
    step: "03",
    title: "Vous pilotez tout en direct",
    description:
      "Cuisine, caisse, réservations et rapports se synchronisent en temps réel. Vous décidez sur des chiffres, plus au feeling.",
    icon: LineChart,
  },
]

export const SaasWorkflow = () => {
  return (
    <section id="workflow" className="relative py-24 sm:py-32 bg-background overflow-hidden">
      <div className="warm-aura absolute inset-0 -z-10 opacity-60" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Comment ça marche"
          title={<>Opérationnel en <span className="font-display-italic text-gradient-warm">trois étapes</span></>}
          description="Pas d'installation, pas de matériel, pas de formation de deux jours. De l'inscription au premier ticket, tout tient dans une après-midi."
        />

        <Stagger className="mt-16 grid md:grid-cols-3 gap-6 lg:gap-8" stagger={0.14}>
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative">
              {/* Connecteur pointillé entre étapes (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-9 left-[calc(50%+2.5rem)] right-[-1.5rem] h-px border-t border-dashed border-border" />
              )}
              <div className="relative bg-card border border-border rounded-3xl p-8 h-full shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/10">
                    <s.icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <span className="font-display text-4xl text-foreground/15">{s.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
