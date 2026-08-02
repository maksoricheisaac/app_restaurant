'use client';

import { use, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { WARM, normalizeHex } from '../_lib/theme';
import { ReservationWizard, type ReservationRestaurant } from '../_components/reservation-wizard';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/**
 * Page réservation : responsabilité limitée au chargement des données du
 * restaurant (couleur, limites, session). Toute l'expérience multi-étapes est
 * déléguée à <ReservationWizard>.
 */
export default function ReservationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [restaurant, setRestaurant] = useState<ReservationRestaurant | null>(null);
  const [maxGuests, setMaxGuests] = useState(20);
  const [maxDays, setMaxDays] = useState(30);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/public-menu/${slug}`);
        if (!res.ok) { toast.error('Restaurant introuvable'); return; }
        const data = await res.json();
        setRestaurant(data.tenant);
        if (data.limits) {
          setMaxGuests(data.limits.maxReservationGuests ?? 20);
          setMaxDays(data.limits.maxDaysInAdvance ?? 30);
        }
        if (data.sessionToken) setSessionToken(data.sessionToken);
      } catch {
        toast.error('Impossible de charger les informations');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: WARM.page }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: normalizeHex(restaurant?.primaryColor) }} />
      </div>
    );
  }

  return (
    <ReservationWizard
      slug={slug}
      restaurant={restaurant}
      maxGuests={maxGuests}
      maxDays={maxDays}
      sessionToken={sessionToken}
    />
  );
}
