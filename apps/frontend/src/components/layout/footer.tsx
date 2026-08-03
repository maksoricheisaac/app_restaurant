import { ChefHat, Twitter, Linkedin, Instagram, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const SOLUTIONS = [
  { label: 'Notre menu',        href: '/menu' },
  { label: 'Commander en ligne', href: '/menu/order' },
  { label: 'Réserver une table', href: '/menu/reservation' },
  { label: 'Suivre ma commande', href: '/menu' },
];

const COMPANY = [
  { label: 'À propos',        href: '/about'   },
  { label: 'Contact',         href: '/contact' },
  { label: 'Mentions légales', href: '/legal' },
  { label: 'Confidentialité', href: '/privacy' },
];

const SOCIAL = [
  { icon: Twitter,   href: '#', label: 'Twitter'   },
  { icon: Linkedin,  href: '#', label: 'LinkedIn'  },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-foreground text-background overflow-hidden">
      {/* Filet chaud en haut */}
      <div className="absolute inset-x-0 top-0 h-px [background:linear-gradient(90deg,transparent,oklch(0.645_0.205_44/0.5),transparent)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-background/10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-5">
              <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-200">
                <ChefHat className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span className="font-display text-xl text-background">Flash Menu</span>
            </Link>
            <p className="text-sm text-background/55 leading-relaxed mb-6 max-w-xs">
              La plateforme SaaS qui digitalise votre restaurant en deux minutes : menu QR,
              commandes en ligne, cuisine connectée et rapports en temps réel.
            </p>
            <div className="flex gap-2">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-9 w-9 rounded-xl bg-background/8 hover:bg-primary hover:text-primary-foreground text-background/70 transition-colors duration-150 flex items-center justify-center"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Le restaurant */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-4">Le restaurant</p>
            <ul className="space-y-2.5">
              {SOLUTIONS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-background/60 hover:text-background transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-4">Entreprise</p>
            <ul className="space-y-2.5">
              {COMPANY.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-background/60 hover:text-background transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-4">Restez informé</p>
            <p className="text-sm text-background/60 mb-4">
              Conseils, mises à jour produit et actualités restaurant.
            </p>
            <form className="flex gap-2" action="#">
              <input
                type="email"
                placeholder="votre@email.com"
                aria-label="Adresse e-mail"
                className="flex-1 min-w-0 rounded-xl border border-background/15 bg-background/8 px-3 py-2.5 text-sm text-background placeholder:text-background/40 focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
              <button
                type="submit"
                className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                aria-label="S'abonner"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="text-[11px] text-background/40 mt-2">
              Pas de spam. Désabonnement en 1 clic.
            </p>
          </div>
        </div>

        {/* Wordmark éditorial géant */}
        <div aria-hidden className="pointer-events-none select-none py-6">
          <p className="font-display text-[16vw] leading-none text-background/[0.05] tracking-tight">Flash Menu</p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-background/10">
          <p className="text-xs text-background/50 text-center sm:text-left pt-5">
            © {year} Flash Menu. Tous droits réservés.
          </p>
          <p className="text-xs text-background/40 pt-5">
            Conçu avec soin pour les restaurateurs.
          </p>
        </div>

      </div>
    </footer>
  );
}
