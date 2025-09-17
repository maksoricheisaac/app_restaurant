import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Message } from '@/types/message';

interface MessageDetailsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  message: Message | null;
  isLoading: boolean;
}

export function MessageDetails({
  isOpen,
  onOpenChange,
  message,
  isLoading,
}: MessageDetailsProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails du Message</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nom du client</label>
                <p className="mt-1">{message?.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="mt-1">{message?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Téléphone</label>
                <p className="mt-1">{message?.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <p className="mt-1">{message?.createdAt ? formatDate(message.createdAt) : '-'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Sujet</label>
              <p className="mt-1">{message?.subject}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <p className="mt-1 whitespace-pre-wrap">{message?.message}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 