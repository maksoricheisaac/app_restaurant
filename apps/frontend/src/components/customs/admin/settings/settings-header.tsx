import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SettingsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Paramètres système</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
          Configuration avancée du système - Accès administrateur requis
        </p>
      </div>
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 flex-shrink-0 w-fit">
        <Shield className="w-3 h-3 md:w-4 md:h-4 mr-1" />
        <span className="text-xs md:text-sm">Admin uniquement</span>
      </Badge>
    </div>
  );
} 