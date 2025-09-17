import { Suspense } from "react";
import { CashRegisterDashboard } from "@/components/customs/admin/cash-register/cash-register-dashboard";
import { CashRegisterSkeleton } from "@/components/customs/admin/cash-register/cash-register-skeleton";

export const metadata = {
  title: "Gestion de Caisse | Restaurant Admin",
  description: "Module de gestion de caisse pour le restaurant",
};

export default function CashRegisterPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de Caisse</h1>
          <p className="text-gray-600 mt-2">
            Gérez les paiements et consultez les statistiques de vente
          </p>
        </div>
      </div>

      <Suspense fallback={<CashRegisterSkeleton />}>
        <CashRegisterDashboard />
      </Suspense>
    </div>
  );
} 