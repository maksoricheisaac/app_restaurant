"use client";

import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { SettingsTabs } from "@/components/customs/admin/settings";
import { Permission } from "@/types/permissions";

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_SETTINGS}>
      <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Paramètres</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Gérez les paramètres de votre restaurant</p>
          </div>
        </div>
        
        <SettingsTabs />
      </div>
    </ProtectedRoute>
  );
}