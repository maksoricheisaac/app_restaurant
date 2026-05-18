import { MessageSquare } from 'lucide-react';

interface MessageHeaderProps {
  periodFilter?: 'today' | 'week' | 'month' | 'all';
  selectedDate?: string;
}

export function MessageHeader({ periodFilter = 'today', selectedDate }: MessageHeaderProps) {
  const getPeriodLabel = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      const formattedDate = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return `Messages du ${formattedDate}`;
    }

    switch (periodFilter) {
      case 'today':
        return "Messages d'aujourd'hui";
      case 'week':
        return 'Messages de cette semaine';
      case 'month':
        return 'Messages de ce mois';
      case 'all':
      default:
        return "Messages d'aujourd'hui";
    }
  };

  return (
    <div className="flex items-center gap-3 md:gap-4">
      <div className="bg-blue-100 p-2 md:p-3 rounded-full flex-shrink-0">
        <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">Gestion des Messages</h1>
        <p className="text-sm md:text-base text-gray-600 truncate">{getPeriodLabel()}</p>
      </div>
    </div>
  );
}