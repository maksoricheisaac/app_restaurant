"use client";

import { AdvancedPermissionsManagement } from "@/components/customs/admin/settings/advanced-permissions-management";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";

export default function PermissionsPage() {
  return (
    <ProtectedRoute requiredPermission={Permission.MANAGE_PERMISSIONS}>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestion des Permissions</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configurez les permissions pour chaque utilisateur ou rôle
          </p>
        </div>

        <AdvancedPermissionsManagement />
      </div>
    </ProtectedRoute>
  );
}
