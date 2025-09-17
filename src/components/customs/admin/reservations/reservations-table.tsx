import { Eye, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Table {
  id: string;
  number: number;
  seats: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface Reservation {
  id: string;
  date: Date;
  time: string | null;
  guests: number | null;
  status: string;
  notes: string | null;
  specialRequests: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  tableId: string | null;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  table: Table | null;
  user: User | null;
}

interface ReservationsTableProps {
  reservations: Reservation[];
  onViewReservation: (reservation: Reservation) => void;
  onDeleteReservation: (id: string) => void;
}

export function ReservationsTable({
  reservations,
  onViewReservation,
  onDeleteReservation,
}: ReservationsTableProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      default:
        return 'Terminée';
    }
  };

  const getCustomerInfo = (reservation: Reservation) => {
    if (reservation.user) {
      return {
        name: reservation.user.name,
        email: reservation.user.email,
        phone: reservation.user.phone || 'Non renseigné'
      };
    } else {
      return {
        name: reservation.customerName || 'Anonyme',
        email: reservation.email || 'Non renseigné',
        phone: reservation.phone || 'Non renseigné'
      };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Liste des réservations
          {reservations.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({reservations.length} réservation{reservations.length > 1 ? 's' : ''})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-4">
            <p className="text-muted-foreground">Aucune réservation trouvée</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Personnes</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => {
                  const customerInfo = getCustomerInfo(reservation);
                  return (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customerInfo.name}</div>
                          <div className="text-sm text-gray-500">{customerInfo.email}</div>
                          <div className="text-sm text-gray-500">{customerInfo.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(reservation.date)}</TableCell>
                      <TableCell>{reservation.time || 'Non spécifiée'}</TableCell>
                      <TableCell>{reservation.guests || 'Non spécifié'}</TableCell>
                      <TableCell>
                        {reservation.table ? `Table ${reservation.table.number}` : 'Non assignée'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(reservation.status)}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewReservation(reservation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteReservation(reservation.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 