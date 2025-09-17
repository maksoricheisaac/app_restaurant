import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SettingsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres système</h1>
        <p className="text-gray-600 mt-2">Configuration avancée du système - Accès administrateur requis</p>
      </div>
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
        <Shield className="w-4 h-4 mr-1" />
        Admin uniquement
      </Badge>
    </div>
  );
} 