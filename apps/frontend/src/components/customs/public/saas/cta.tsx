import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export const SaasCTA = () => {
  return (
    <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] mix-blend-overlay opacity-10" />
      <div className="container px-4 mx-auto relative z-10 text-center">
        <h2 className="text-3xl lg:text-5xl font-extrabold mb-8 max-w-3xl mx-auto leading-tight">
          Prêt à moderniser votre établissement ?
        </h2>
        <p className="text-xl mb-12 text-primary-foreground/90 max-w-2xl mx-auto">
          Rejoignez des centaines de restaurateurs qui ont déjà sauté le pas. Flash Menu est la clé de votre succès digital.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" variant="secondary" className="h-14 px-10 text-lg rounded-full shadow-2xl hover:shadow-black/20">
            <Link href="/auth/register">
              Créer mon compte
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full bg-transparent border-primary-foreground/50 hover:bg-primary-foreground/10 text-primary-foreground">
            <Link href="/contact">Demander une démo</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
