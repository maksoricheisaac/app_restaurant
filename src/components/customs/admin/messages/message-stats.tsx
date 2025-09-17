import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Message } from '@/generated/prisma';

type MessageStatus = 'new' | 'read' | 'replied' | 'closed';

interface MessageStatsProps {
  totalMessages: number;
  newMessages: number;
  messages?: Message[];
  periodFilter?: 'today' | 'week' | 'month' | 'all';
  selectedDate?: string;
}

export function MessageStats({ 
  totalMessages, 
  newMessages, 
  messages = [],
  periodFilter = 'today',
  selectedDate
}: MessageStatsProps) {
  const repliedMessages = messages.filter((m) => m.status === 'replied').length;
  const archivedMessages = messages.filter((m) => m.status === 'archived').length;
  const readMessages = messages.filter((m) => m.status === 'read').length;

  const getPeriodLabel = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    switch (periodFilter) {
      case 'today':
        return "aujourd'hui";
      case 'week':
        return 'cette semaine';
      case 'month':
        return 'ce mois';
      case 'all':
        return 'toutes périodes';
      default:
        return "aujourd'hui";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <span className="text-xs text-muted-foreground">{getPeriodLabel()}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMessages}</div>
          <p className="text-xs text-muted-foreground">
            Messages reçus {getPeriodLabel()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nouveaux</CardTitle>
          <span className="text-xs text-muted-foreground">Non lus</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{newMessages}</div>
          <p className="text-xs text-muted-foreground">
            {newMessages > 0 ? 'Nécessitent une attention' : 'Aucun nouveau message'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Répondu</CardTitle>
          <span className="text-xs text-muted-foreground">Traité</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{repliedMessages}</div>
          <p className="text-xs text-muted-foreground">
            {repliedMessages > 0 ? 'Messages traités' : 'Aucune réponse'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Archivé</CardTitle>
          <span className="text-xs text-muted-foreground">Terminé</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">{archivedMessages}</div>
          <p className="text-xs text-muted-foreground">
            {archivedMessages > 0 ? 'Messages archivés' : 'Aucun archivé'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 