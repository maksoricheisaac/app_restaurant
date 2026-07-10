"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

interface Restaurant {
  name: string;
  primaryColor: string;
  logo: string | null;
}

function primary(color?: string) {
  return color || "#f97316";
}

export default function ReservationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    date: "",
    time: "",
    guests: "2",
    customerName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/public-menu/${slug}`);
        if (!res.ok) {
          toast.error("Restaurant introuvable");
          return;
        }
        const data = await res.json();
        setRestaurant(data.tenant);
        if (data.sessionToken) setSessionToken(data.sessionToken);
      } catch {
        toast.error("Impossible de charger les informations du restaurant");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  const color = primary(restaurant?.primaryColor);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.customerName || !form.email) {
      toast.error("Merci de renseigner au moins la date, votre nom et votre email");
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionToken) headers["x-menu-session"] = sessionToken;

      const res = await fetch(`${API}/public-menu/${slug}/reservation`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          date: new Date(form.date).toISOString(),
          time: form.time || undefined,
          guests: form.guests ? Number(form.guests) : undefined,
          customerName: form.customerName,
          email: form.email,
          phone: form.phone || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || `Erreur ${res.status}`);
      }

      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'envoyer la demande");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <div className="max-w-md mx-auto px-4 py-8">
        <Link
          href={`/menu/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au menu
        </Link>

        {done ? (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto" style={{ color }} />
            <h1 className="text-xl font-bold text-slate-900">Demande envoyée !</h1>
            <p className="text-sm text-slate-500">
              {restaurant?.name} a bien reçu votre demande de réservation et vous contactera
              pour la confirmer. Un email récapitulatif vous a été envoyé.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="text-center space-y-1">
              <CalendarCheck className="h-8 w-8 mx-auto" style={{ color }} />
              <h1 className="text-lg font-bold text-slate-900">
                Réserver une table {restaurant?.name ? `chez ${restaurant.name}` : ""}
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time">Heure</Label>
                  <Input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="guests">Nombre de convives</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  max={50}
                  value={form.guests}
                  onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerName">Votre nom</Label>
                <Input
                  id="customerName"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  placeholder="Jean Dupont"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jean@exemple.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: color }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi..." : "Envoyer la demande"}
              </Button>
              <p className="text-xs text-slate-400 text-center">
                Cette demande sera confirmée par le restaurant, elle ne réserve pas
                automatiquement votre table.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
