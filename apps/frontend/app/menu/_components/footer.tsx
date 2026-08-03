'use client';

import Image from 'next/image';
import {
  UtensilsCrossed,
  Phone,
  Mail,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Twitter,
} from 'lucide-react';
import type { PublicRestaurant } from '../_lib/types';
import { WARM, withAlpha } from '../_lib/theme';

/** Pied de page identité + contact + réseaux, sur charbon chaud. */
export function MenuFooter({ restaurant, color }: { restaurant: PublicRestaurant; color: string }) {
  const s = restaurant;
  const hasContact = s?.phone || s?.email || s?.address || s?.website;
  const hasSocial = s?.facebookUrl || s?.instagramUrl || s?.twitterUrl;

  return (
    <footer className="mt-4 text-white" style={{ backgroundColor: WARM.dark }}>
      <div className="mx-auto max-w-2xl space-y-8 px-5 pb-8 pt-12">
        <div className="flex items-start gap-4">
          {restaurant.logo ? (
            <Image src={restaurant.logo} alt={restaurant.name} width={64} height={64} className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover shadow-lg" />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg" style={{ backgroundColor: color }}>
              <UtensilsCrossed className="h-8 w-8 text-white" strokeWidth={1.75} />
            </div>
          )}
          <div className="space-y-1.5">
            <h3 className="font-display text-2xl leading-tight text-white">{restaurant.name}</h3>
            {restaurant.cuisineType && (
              <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: withAlpha(color, 0.15), color }}>
                {restaurant.cuisineType}
              </span>
            )}
            {s?.description && (
              <p className="mt-1 line-clamp-2 max-w-xs text-xs leading-relaxed text-white/45">{s.description}</p>
            )}
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {hasContact && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {s?.phone && (
              <a href={`tel:${s.phone}`} className="group flex items-center gap-3 text-white/60 transition-colors hover:text-white">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-white/10">
                  <Phone className="h-4 w-4" style={{ color }} />
                </span>
                <span className="text-sm">{s.phone}</span>
              </a>
            )}
            {s?.email && (
              <a href={`mailto:${s.email}`} className="group flex items-center gap-3 text-white/60 transition-colors hover:text-white">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-white/10">
                  <Mail className="h-4 w-4" style={{ color }} />
                </span>
                <span className="truncate text-sm">{s.email}</span>
              </a>
            )}
            {s?.address && (
              <div className="flex items-start gap-3 text-white/60 sm:col-span-2">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5">
                  <MapPin className="h-4 w-4" style={{ color }} />
                </span>
                <span className="text-sm leading-relaxed">{s.address}</span>
              </div>
            )}
            {s?.website && (
              <a href={s.website} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-white/60 transition-colors hover:text-white">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-white/10">
                  <Globe className="h-4 w-4" style={{ color }} />
                </span>
                <span className="truncate text-sm">{s.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>
        )}

        {hasSocial && (
          <div className="flex items-center gap-2.5">
            {s?.instagramUrl && (
              <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/10">
                <Instagram className="h-4 w-4 text-white/70" />
              </a>
            )}
            {s?.facebookUrl && (
              <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/10">
                <Facebook className="h-4 w-4 text-white/70" />
              </a>
            )}
            {s?.twitterUrl && (
              <a href={s.twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/10">
                <Twitter className="h-4 w-4 text-white/70" />
              </a>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 pt-5">
          <p className="text-xs text-white/35">© {new Date().getFullYear()} {restaurant.name}</p>
          <p className="text-xs text-white/35">
            Propulsé par <span className="font-semibold" style={{ color }}>Flash Menu</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
