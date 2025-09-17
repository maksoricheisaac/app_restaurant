 
"use client"
import { useState, useEffect } from 'react';
import { Menu, X, ChefHat, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartButton } from '@/components/cart/cart-button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { UserNav } from './user-nav';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const session = useSession()

  const navigation = [
    { name: 'Accueil', href: '/', current: pathname === '/' },
    { name: 'À propos', href: '/about', current: pathname === '/about' },
    { name: 'Menu', href: '/menu', current: pathname === '/menu' },
    { name: 'Galerie', href: '/gallery', current: pathname === '/gallery' },
    { name: 'Contact', href: '/contact', current: pathname === '/contact'}
  ];

  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenuClick = (href: string) => {
    setIsMenuOpen(false);
    // Smooth scroll to top when navigating to menu
    if (href === '/menu') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300",
      isScrolled 
        ? "bg-white/95 backdrop-blur-md shadow-xl border-b border-orange-100" 
        : "bg-white/90 backdrop-blur-sm shadow-lg border-b border-orange-50"
    )}>
      <nav className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo amélioré */}
          <Link href="/" className="flex items-center space-x-3 text-orange-600 hover:text-orange-700 transition-all duration-300 group">
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-600 to-orange-700 text-white p-3 rounded-2xl group-hover:from-orange-700 group-hover:to-orange-800 transition-all duration-300 shadow-lg group-hover:shadow-xl transform group-hover:scale-105">
                <div className="relative">
                  <ChefHat className="h-7 w-7" />
                  <Utensils className="h-3 w-3 absolute -bottom-1 -right-1 text-orange-200" />
                </div>
              </div>
              {/* Accent africain */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                Resto_Congo
              </span>
              <span className="text-xs text-gray-500 font-medium tracking-wide">
                Restaurant Africain • Brazzaville
              </span>
            </div>
          </Link>

          {/* Desktop Navigation améliorée */}
          <div className="hidden md:flex space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => handleMenuClick(item.href)}
                className={cn(
                  'relative px-5 py-3 text-sm font-medium transition-all duration-300 rounded-xl overflow-hidden group',
                  item.current
                    ? 'text-white bg-gradient-to-r from-orange-600 to-orange-700 shadow-lg shadow-orange-500/25'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100',
                  item.name === 'Suivi Commande' && 'flex items-center space-x-2'
                )}
              >
                <span className="relative z-10">{item.name}</span>
                {item.current && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700"></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full translate-y-1"></div>
                  </>
                )}
                {!item.current && (
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                )}
              </Link>
            ))}
          </div>

          {/* Cart and CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <CartButton 
              variant="outline" 
              className="border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
            />
            {/* Si l'utilisateur n'est pas connecté, bouton Se connecter */}
            {!session.data?.user ? (
              <Button asChild className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-3 rounded-xl font-semibold">
                <Link href="/login">
                  <span className="flex items-center space-x-2">
                    <span>Se connecter</span>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </span>
                </Link>
              </Button>
            ) : (
              <UserNav user={{
                name: session.data.user.name,
                email: session.data.user.email,
                avatar: session.data.user.image || "",
                role: session.data.user.role || ""
              }} />
            )}
          </div>

          {/* Mobile menu button amélioré */}
          <div className="md:hidden flex items-center space-x-2">
            <CartButton 
              variant="outline" 
              size="sm"
              className="border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu de navigation"
              className={cn(
                "text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-300 rounded-xl p-3",
                isMenuOpen && "bg-orange-50 text-orange-600"
              )}
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                <Menu className={cn(
                  "h-6 w-6 absolute transition-all duration-300",
                  isMenuOpen ? "opacity-0 rotate-180" : "opacity-100 rotate-0"
                )} />
                <X className={cn(
                  "h-6 w-6 absolute transition-all duration-300",
                  isMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-180"
                )} />
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation améliorée */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-500 ease-in-out",
          isMenuOpen 
            ? "max-h-112 opacity-100 pb-6"
            : "max-h-0 opacity-0 pb-0"
        )}>
          <div className="border-t border-orange-100 pt-4 bg-gradient-to-b from-white to-orange-50/30 rounded-b-2xl">
            <div className="flex flex-col space-y-2 px-4">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'mx-2 px-4 py-4 text-base font-medium transition-all duration-300 rounded-xl transform',
                    item.current
                      ? 'text-white bg-gradient-to-r from-orange-600 to-orange-700 shadow-lg scale-105'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:scale-105',
                    item.name === 'Suivi Commande' && 'flex items-center space-x-2'
                  )}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: isMenuOpen ? 'slideInFromRight 0.5s ease-out forwards' : 'none'
                  }}
                  onClick={() => handleMenuClick(item.href)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{item.name}</span>
                    </div>
                    {item.current && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </Link>
              ))}
              <div className="px-2 pt-4">
                {/* Si l'utilisateur n'est pas connecté, bouton Se connecter */}
                {!session.data?.user ? (
                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg rounded-xl py-4 font-semibold transform hover:scale-105 transition-all duration-300"
                    style={{ 
                      animationDelay: `${navigation.length * 100}ms`,
                      animation: isMenuOpen ? 'slideInFromRight 0.5s ease-out forwards' : 'none'
                    }}
                  >
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <span className="flex items-center justify-center space-x-2">
                        <span>Se connecter</span>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </span>
                    </Link>
                  </Button>
                ) : (
                  <UserNav user={{
                    name: session.data.user.name,
                    email: session.data.user.email,
                    avatar: session.data.user.image || "",
                    role: session.data.user.role || ""
                  }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </header>
  );
}