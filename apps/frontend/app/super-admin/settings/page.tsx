'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Shield, Bell, Globe, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  {
    icon: Globe,
    iconColor: 'text-primary',
    title: 'Général',
    description: 'Configuration du nom, logo et domaine principal de la plateforme.',
  },
  {
    icon: Shield,
    iconColor: 'text-orange-500',
    title: 'Sécurité & Maintenance',
    description: 'Gestion du mode maintenance, clés API et politiques de sécurité.',
  },
  {
    icon: Bell,
    iconColor: 'text-blue-500',
    title: 'Notifications Système',
    description: 'Configuration des alertes globales et notifications pour les admins.',
  },
];

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Paramètres Plateforme</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configurez les réglages globaux de Flash Menu.
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Save className="h-4 w-4" />
          Enregistrer
        </Button>
      </div>

      <div className="grid gap-4">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Icon className={`h-4 w-4 ${s.iconColor}`} />
                  </div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </div>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-24 gap-2 rounded-lg border-2 border-dashed border-border">
                  <AlertCircle className="h-5 w-5 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">En cours de déploiement.</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
