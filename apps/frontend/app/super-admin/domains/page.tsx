'use client';

import {
  Globe, CheckCircle2, Clock, Info, Copy, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { toast } from 'sonner';

interface DomainRow {
  id: string;
  domain: string;
  verified: boolean;
  tenant: { id: string; name: string; slug: string } | null;
}

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copié dans le presse-papiers.');
}

export default function DomainsPage() {
  const { data: domains, isLoading } = useQuery<DomainRow[]>({
    queryKey: ['admin-domains'],
    queryFn: () => api.get('/domains'),
  });

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
      </div>

      {/* DNS instructions */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">Configuration DNS requise</p>
          <p className="text-blue-700 dark:text-blue-400 text-xs">
            Pour chaque domaine, créez un enregistrement <strong>CNAME</strong> pointant vers{' '}
            <button
              onClick={() => copy('cname.flashmenu.app')}
              className="font-mono bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors inline-flex items-center gap-1"
            >
              cname.flashmenu.app
              <Copy className="h-3 w-3" />
            </button>.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-primary/50" />
            </div>
          ) : !domains || domains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-3">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <Globe className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Aucun domaine personnalisé</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Les domaines rattachés aux restaurants apparaîtront ici dès qu&apos;un
                  établissement en configurera un.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {domains.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium truncate">{d.domain}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.tenant ? `${d.tenant.name} · ${d.tenant.slug}` : 'Restaurant inconnu'}
                      </p>
                    </div>
                  </div>
                  {d.verified ? (
                    <Badge className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-100">
                      <CheckCircle2 className="h-3 w-3" /> Vérifié
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200">
                      <Clock className="h-3 w-3" /> En attente
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
