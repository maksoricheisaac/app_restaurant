"use client";

import { useEffect, useState } from "react";
import { Rocket, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ONBOARDING_KEY = "flash_menu_onboarding_done";

export function SetupBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
        <Rocket className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-orange-900">
          Finalisez la configuration de votre restaurant
        </p>
        <p className="text-xs text-orange-700 mt-0.5">
          Ajoutez vos coordonnées, votre premier plat et générez vos QR codes de table.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button asChild size="sm" variant="default" className="h-8 gap-1 text-xs">
          <Link href="/admin/onboarding">
            Configurer
            <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
        <button
          onClick={dismiss}
          className="flex h-7 w-7 items-center justify-center rounded-full text-orange-400 hover:bg-orange-100 hover:text-orange-600 transition-colors"
          aria-label="Ignorer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
