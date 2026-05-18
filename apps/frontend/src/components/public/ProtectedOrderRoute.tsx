"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedOrderRouteProps {
  children: React.ReactNode;
}

export function ProtectedOrderRoute({ 
  children 
}: ProtectedOrderRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification de l&#39;authentification...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Si l'utilisateur est connecté, afficher le contenu
  return <>{children}</>;
}