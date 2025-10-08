"use client";

import { Suspense } from "react";
import { CashRegisterDashboard } from "@/components/customs/admin/cash-register/cash-register-dashboard";
import { CashRegisterSkeleton } from "@/components/customs/admin/cash-register/cash-register-skeleton";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";

export default function CashRegisterPage() {
  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_CASH_REGISTER}>
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
    </ProtectedRoute>
  );
} 