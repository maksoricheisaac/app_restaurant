import { CalendarIcon, CheckCircle, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatisticsCardsProps {
  totalReservations: number;
  confirmedReservations: number;
  pendingReservations: number;
  totalGuests: number;
}

export function StatisticsCards({
  totalReservations,
  confirmedReservations,
  pendingReservations,
  totalGuests,
}: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Réservations</p>
              <p className="text-2xl font-bold text-gray-900">{totalReservations}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Confirmées</p>
              <p className="text-2xl font-bold text-gray-900">{confirmedReservations}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{pendingReservations}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Convives</p>
              <p className="text-2xl font-bold text-gray-900">{totalGuests.toString()}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 