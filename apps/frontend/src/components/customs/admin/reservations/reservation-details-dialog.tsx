import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Reservation, ReservationStatus } from '@/types/reservation';

interface ReservationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onStatusChange: (reservation: Reservation, newStatus: ReservationStatus) => void;
}

export function ReservationDetailsDialog({
  isOpen,
  onClose,
  reservation,
  onStatusChange,
}: ReservationDetailsDialogProps) {
  if (!reservation) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  const customerInfo = getCustomerInfo(reservation);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails de la Réservation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nom du client</label>
              <p className="mt-1">{customerInfo.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="mt-1">{customerInfo.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Téléphone</label>
              <p className="mt-1">{customerInfo.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <p className="mt-1">{formatDate(reservation.date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Heure</label>
              <p className="mt-1">{reservation.time || 'Non spécifiée'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Nombre de personnes</label>
              <p className="mt-1">{reservation.guests || 'Non spécifié'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Table</label>
              <p className="mt-1">
                {reservation.table ? `Table ${reservation.table.number} (${reservation.table.seats} places)` : 'Non assignée'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Statut</label>
              <div className="mt-1">
                <Select
                  value={reservation.status}
                  onValueChange={(value: ReservationStatus) => onStatusChange(reservation, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {reservation.notes && (
            <div>
              <label className="text-sm font-medium">Notes</label>
              <p className="mt-1 text-sm text-gray-600">{reservation.notes}</p>
            </div>
          )}

          {reservation.specialRequests && (
            <div>
              <label className="text-sm font-medium">Demandes spéciales</label>
              <p className="mt-1 text-sm text-gray-600">{reservation.specialRequests}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <label className="font-medium">Créée le</label>
              <p>{formatDate(reservation.createdAt)}</p>
            </div>
            <div>
              <label className="font-medium">Modifiée le</label>
              <p>{formatDate(reservation.updatedAt)}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 