import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import React from "react";

interface DashboardHeaderProps {
  user: { name?: string } | null;
  role: string | undefined;
  isAdmin: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, role, isAdmin }) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
      <p className="text-gray-600 mt-2">
        Bienvenue, {user?.name} - Connecté en tant que {role === 'admin' ? 'Administrateur' : 'Manager'}
      </p>
    </div>
    <div className="flex items-center space-x-2">
      <Badge variant={isAdmin ? "destructive" : "secondary"}>
        <Shield className="w-4 h-4 mr-1" />
        {isAdmin ? "Administrateur" : "Manager"}
      </Badge>
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        En ligne
      </Badge>
    </div>
  </div>
); 