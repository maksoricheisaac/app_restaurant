/* eslint-disable react/no-unescaped-entities */
"use client";

import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { SettingsTabs } from "@/components/customs/admin/settings";
import { Permission } from "@/types/permissions";

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_SETTINGS}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Paramètres</h1>
            <p className="text-muted-foreground">
              Gérez la configuration de votre restaurant et de l'application
            </p>
          </div>
        </div>
        
        <SettingsTabs />
      </div>
    </ProtectedRoute>
  );
}