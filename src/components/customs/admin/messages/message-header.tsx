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
        return 'Tous les messages';
      default:
        return "Messages d'aujourd'hui";
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="bg-blue-100 p-3 rounded-full">
        <MessageSquare className="h-6 w-6 text-blue-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Messages</h1>
        <p className="text-gray-600">{getPeriodLabel()}</p>
      </div>
    </div>
  );
} 