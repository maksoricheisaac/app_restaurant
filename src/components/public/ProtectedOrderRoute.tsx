"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedOrderRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedOrderRoute({ 
  children, 
  redirectTo = "/login" 
}: ProtectedOrderRouteProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push(redirectTo);
    }
  }, [session, isPending, router, redirectTo]);

  // Afficher un loader pendant la vérification de l'authentification
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, ne rien afficher (redirection en cours)
  if (!session?.user) {
    return null;
  }

  // Si l'utilisateur est connecté, afficher le contenu
  return <>{children}</>;
} 