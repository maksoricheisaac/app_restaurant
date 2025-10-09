import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Message } from '@/types/message';


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
      default:
        return "aujourd'hui";
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium truncate">Total</CardTitle>
          <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">{getPeriodLabel()}</span>
        </CardHeader>
        <CardContent>
          <div className="text-lg md:text-2xl font-bold">{totalMessages}</div>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
            Messages reçus
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium truncate">Nouveaux</CardTitle>
          <span className="text-[10px] md:text-xs text-muted-foreground">Non lus</span>
        </CardHeader>
        <CardContent>
          <div className="text-lg md:text-2xl font-bold text-blue-600">{newMessages}</div>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
            {newMessages > 0 ? 'À traiter' : 'Aucun'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium truncate">Répondu</CardTitle>
          <span className="text-[10px] md:text-xs text-muted-foreground">Traité</span>
        </CardHeader>
        <CardContent>
          <div className="text-lg md:text-2xl font-bold text-green-600">{repliedMessages}</div>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
            {repliedMessages > 0 ? 'Traités' : 'Aucun'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium truncate">Archivé</CardTitle>
          <span className="text-[10px] md:text-xs text-muted-foreground">Terminé</span>
        </CardHeader>
        <CardContent>
          <div className="text-lg md:text-2xl font-bold text-gray-600">{archivedMessages}</div>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
            {archivedMessages > 0 ? 'Archivés' : 'Aucun'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}