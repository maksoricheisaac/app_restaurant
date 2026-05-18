"use client"

import { useState, useEffect } from 'react';
import { Menu, X, ChefHat, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserNav } from './user-nav';

const NAV_LINKS = [
  { label: 'Accueil',         href: '/' },
  { label: 'Fonctionnalités', href: '/#features' },
  { label: 'Tarifs',          href: '/#pricing' },
  { label: 'À propos',        href: '/about' },
  { label: 'Contact',         href: '/contact' },
] as const;

export function Header() {
  const { user } = useAuth();
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => { setIsOpen(false); }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    const base = href.replace('/#', '/');
    return pathname === base || pathname.startsWith(base + '/');
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 dark:bg-card/95 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-white/85 dark:bg-card/85 backdrop-blur-sm'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
                <ChefHat className="h-5 w-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-amber-400 rounded-full border-2 border-white dark:border-card" />
            </div>
            <div className="leading-none">
              <span className="block font-bold text-[17px] text-foreground">Flash Menu</span>
              <span className="block text-[10px] text-muted-foreground font-medium tracking-wide mt-0.5">
                Gestion restaurant SaaS
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Desktop CTAs ── */}
          <div className="hidden md:flex items-center gap-2">
            {!user ? (
              <>
                <Button asChild variant="ghost" size="sm" className="font-semibold text-muted-foreground hover:text-foreground">
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
                <Button asChild size="sm" className="gap-1.5 font-semibold shadow-sm">
                  <Link href="/auth/register">
                    Essayer gratuitement
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </>
            ) : (
              <UserNav user={{
                name:         user.name,
                email:        user.email,
                avatar:       user.image || '',
                role:         user.role || '',
                platformRole: user.platformRole,
              }} />
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className={cn(
              'md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-border',
              'text-foreground bg-background hover:bg-muted transition-colors duration-150',
            )}
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isOpen
              ? <X    className="h-5 w-5" />
              : <Menu className="h-5 w-5" />
            }
          </button>
        </div>
      </div>

      {/* ── Mobile menu panel ── */}
      <div
        className={cn(
          'md:hidden border-t border-border bg-background/98 backdrop-blur-sm',
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[34rem] opacity-100' : 'max-h-0 opacity-0 pointer-events-none',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150',
                  active
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted/70',
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-3 mt-1 border-t border-border flex flex-col gap-2">
            {!user ? (
              <>
                <Button asChild variant="outline" className="w-full font-semibold">
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
                <Button asChild className="w-full font-semibold gap-2">
                  <Link href="/auth/register">
                    Essayer gratuitement
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <div className="py-2">
                <UserNav user={{
                  name:         user.name,
                  email:        user.email,
                  avatar:       user.image || '',
                  role:         user.role || '',
                  platformRole: user.platformRole,
                }} />
              </div>
            )}
          </div>

          {/* Petit badge SaaS en bas du menu mobile */}
          <div className="flex items-center justify-center gap-1.5 pt-3 pb-1 text-[11px] text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            <span>Essai gratuit 14 jours · Sans carte de crédit</span>
          </div>
        </div>
      </div>
    </header>
  );
}