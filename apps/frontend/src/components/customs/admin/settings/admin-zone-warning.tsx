/* eslint-disable react/no-unescaped-entities */
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminZoneWarning() {
  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-yellow-800 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Zone d'administration
        </CardTitle>
      </CardHeader>
      <CardContent className="text-yellow-700">
        <p>
          Cette section contient des paramètres critiques qui peuvent affecter le fonctionnement 
          de l'ensemble du système. Seuls les administrateurs autorisés peuvent accéder à ces paramètres.
        </p>
      </CardContent>
    </Card>
  );
} 