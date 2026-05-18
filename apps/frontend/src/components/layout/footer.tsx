import { ChefHat, Twitter, Linkedin, Instagram, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const SOLUTIONS = [
  { label: 'Menu QR Code',       href: '/#features' },
  { label: 'Commandes en ligne', href: '/#features' },
  { label: 'Kitchen Display',    href: '/#features' },
  { label: 'Gestion de salle',   href: '/#features' },
  { label: 'Nos tarifs',         href: '/#pricing'  },
];

const COMPANY = [
  { label: 'À propos',       href: '/about'   },
  { label: 'Contact',        href: '/contact' },
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
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group mb-5">
              <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow group-hover:scale-105 transition-transform duration-200">
                <ChefHat className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-white">Flash Menu</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
              La solution SaaS qui digitalise votre restaurant en 2 minutes : menu QR, commandes en
              ligne, cuisine connectée et rapports en temps réel.
            </p>
            <div className="flex gap-2">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-primary hover:text-white text-slate-400 transition-colors duration-150 flex items-center justify-center"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Solutions</p>
            <ul className="space-y-2.5">
              {SOLUTIONS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Entreprise</p>
            <ul className="space-y-2.5">
              {COMPANY.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Restez informé</p>
            <p className="text-sm text-slate-400 mb-4">
              Conseils, mises à jour produit et actualités restaurant.
            </p>
            <form
              className="flex gap-2"
              action="#"
            >
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
              <button
                type="submit"
                className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                aria-label="S'abonner"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="text-[11px] text-slate-600 mt-2">
              Pas de spam. Désabonnement en 1 clic.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-7">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            © {year} Flash Menu. Tous droits réservés.
          </p>
          <p className="text-xs text-slate-600">
            Fait avec ❤︎ pour les restaurateurs
          </p>
        </div>

      </div>
    </footer>
  );
}