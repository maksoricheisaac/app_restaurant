"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, ExternalLink, Store, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api-client";

// ─── Hook — fetches tenant identity independently of TenantContext ────────────
// Uses the same api-client pattern as useSettings() — no timing dependency.

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  status: string;
}

function useTenantInfo() {
  return useQuery<TenantInfo>({
    queryKey: ["tenant-me"],
    queryFn: () => api.get("/tenants/me") as Promise<TenantInfo>,
    staleTime: 5 * 60 * 1000, // 5 min — slug doesn't change often
  });
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  enterprise: "Enterprise",
};

const PLAN_VARIANTS: Record<string, "secondary" | "default" | "outline"> = {
  free: "secondary",
  pro: "default",
  enterprise: "outline",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RestaurantInfoCard() {
  const { data: tenant, isLoading, isError } = useTenantInfo();

  const [copied, setCopied] = useState(false);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className="border-orange-200 bg-orange-50/40">
        <CardHeader className="pb-3 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // ── No tenant context (fresh session not yet stored) ─────────────────────
  if (isError || !tenant) {
    return (
      <Card className="border-slate-200 bg-slate-50/40">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-slate-400" />
            <CardTitle className="text-base text-slate-500">Lien du menu client</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Rechargez la page ou reconnectez-vous pour afficher les informations du restaurant.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // ── Nominal ───────────────────────────────────────────────────────────────
  const menuUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${tenant.slug}`
      : `/menu/${tenant.slug}`;

  function handleCopy() {
    navigator.clipboard.writeText(menuUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="border-orange-200 bg-orange-50/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-orange-500 shrink-0" />
            <CardTitle className="text-base">{tenant.name}</CardTitle>
          </div>
          <Badge variant={PLAN_VARIANTS[tenant.plan] ?? "secondary"}>
            {PLAN_LABELS[tenant.plan] ?? tenant.plan}
          </Badge>
        </div>
        <CardDescription className="text-xs font-mono text-slate-500 mt-1">
          slug :{" "}
          <span className="font-semibold text-slate-700 select-all">{tenant.slug}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        <p className="text-xs font-medium text-slate-600">Lien du menu client</p>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <span className="flex-1 truncate text-sm text-slate-700 font-mono select-all">
            {menuUrl}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-slate-500 hover:text-orange-600"
            onClick={handleCopy}
            title="Copier le lien"
          >
            {copied
              ? <Check className="h-4 w-4 text-green-500" />
              : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-slate-500 hover:text-orange-600"
            asChild
          >
            <a href={menuUrl} target="_blank" rel="noopener noreferrer" title="Ouvrir le menu">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Partagez ce lien avec vos clients ou générez un QR code depuis la page{" "}
          <a href="/admin/tables" className="underline hover:text-orange-500">Tables</a>.
        </p>
      </CardContent>
    </Card>
  );
}
