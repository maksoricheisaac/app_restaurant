'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  UtensilsCrossed,
  ChevronRight,
  CalendarCheck,
  Search,
} from 'lucide-react';
import type { PublicRestaurant } from '../_lib/types';
import { WARM, withAlpha } from '../_lib/theme';

const badgeCls =
  'inline-flex items-center rounded-full border border-white/15 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm';

/**
 * Hero éditorial du menu : bannière + voile chaud (ou dégradé de marque en
 * fallback), logo, accroche, badges, CTA. Une barre de recherche ancrée
 * chevauche le bas du hero pour inviter à explorer.
 */
export function MenuHero({
  restaurant,
  color,
  onBrand,
  totalItems,
  tableNumber,
  reservationHref,
  onSearchFocus,
  searchQuery,
  onSearchChange,
}: {
  restaurant: PublicRestaurant;
  color: string;
  onBrand: string;
  totalItems: number;
  tableNumber: number | null;
  reservationHref: string;
  onSearchFocus?: () => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}) {
  const settings = restaurant;

  return (
    <header className="relative">
      <div className="relative flex min-h-[320px] flex-col justify-end overflow-hidden sm:min-h-[400px] landscape:min-h-[260px]">
        {restaurant.bannerUrl ? (
          <>
            <Image
              src={restaurant.bannerUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${WARM.dark}f2 0%, ${WARM.dark}80 42%, ${WARM.dark}14 100%)`,
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(152deg, ${color} 0%, ${withAlpha(color, 0.8)} 44%, ${WARM.dark} 100%)`,
              }}
            />
            <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full bg-white opacity-[0.10] blur-2xl" />
            <div className="absolute -left-12 top-10 h-52 w-52 rounded-full bg-white opacity-[0.07] blur-2xl" />
          </>
        )}

        <div className="relative mx-auto w-full max-w-2xl space-y-4 px-5 pb-14 pt-14 sm:space-y-5 sm:pb-16 sm:pt-20">
          {restaurant.logo ? (
            <Image
              src={restaurant.logo}
              alt={restaurant.name}
              width={80}
              height={80}
              className="h-18 w-18 rounded-2xl object-cover shadow-2xl ring-1 ring-white/25"
            />
          ) : (
            <div
              className="flex h-18 w-18 items-center justify-center rounded-2xl shadow-2xl ring-1 ring-white/25"
              style={{ backgroundColor: withAlpha(color, 0.8) }}
            >
              <UtensilsCrossed className="h-9 w-9 text-white" strokeWidth={1.75} />
            </div>
          )}

          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              <span className="h-px w-6 bg-white/40" />
              Notre carte
            </span>
            <h1 className="font-display break-words text-3xl leading-[1.05] tracking-tight text-white drop-shadow-sm sm:text-5xl">
              {restaurant.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {restaurant.cuisineType && <span className={badgeCls}>{restaurant.cuisineType}</span>}
              {tableNumber && <span className={badgeCls}>Table {tableNumber}</span>}
              <span className={badgeCls}>
                {totalItems} plat{totalItems > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {settings?.description && (
            <p className="max-w-md text-sm leading-relaxed text-white/85">
              {settings.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
            <button
              type="button"
              onClick={onSearchFocus}
              className="inline-flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-semibold shadow-2xl transition-transform hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: color, color: onBrand, boxShadow: `0 10px 32px ${withAlpha(color, 0.33)}` }}
            >
              <UtensilsCrossed className="h-4 w-4" />
              Explorer le menu
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link
              href={reservationHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition-colors hover:text-white"
            >
              <CalendarCheck className="h-4 w-4" />
              Réserver une table
            </Link>
          </div>
        </div>
      </div>

      {/* Barre de recherche ancrée qui chevauche le bas du hero */}
      <div className="relative z-10 mx-auto -mt-7 max-w-2xl px-4">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg"
          style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}
        >
          <Search className="h-5 w-5 flex-shrink-0" style={{ color: WARM.faint }} />
          <input
            type="search"
            inputMode="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un plat…"
            aria-label="Rechercher un plat"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--ph)]"
            style={{ color: WARM.ink, ['--ph' as string]: WARM.faint }}
          />
        </div>
      </div>
    </header>
  );
}
