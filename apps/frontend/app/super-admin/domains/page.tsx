'use client';

import {
  Globe,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Info,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copié dans le presse-papiers.');
}

export default function DomainsPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Domaines</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Domaines personnalisés associés aux restaurants.
          </p>
        </div>
        <Button size="sm" className="shadow-sm shadow-primary/20" disabled>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Ajouter un domaine
        </Button>
      </div>

      {/* DNS instructions */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">Configuration DNS requise</p>
          <p className="text-blue-700 dark:text-blue-400 text-xs">
            Pour chaque domaine, créez un enregistrement{' '}
            <strong>CNAME</strong> pointant vers{' '}
            <button
              onClick={() => copy('cname.flashmenu.app')}
              className="font-mono bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors inline-flex items-center gap-1"
            >
              cname.flashmenu.app
              <Copy className="h-3 w-3" />
            </button>{' '}
            puis cliquez sur &quot;Vérifier&quot;.
          </p>
        </div>
      </div>

      {/* Placeholder — pas encore d'API domaines */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-4">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Globe className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Gestion des domaines à venir</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                La liste des domaines personnalisés sera affichée ici dès que
                l&apos;endpoint <span className="font-mono">/domains</span> sera disponible côté API.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-5 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Vérification DNS automatique
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Statut en temps réel
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                Alertes d&apos;échec DNS
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
