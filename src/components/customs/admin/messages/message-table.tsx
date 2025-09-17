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
import { Message } from '@/generated/prisma';

type MessageStatus = 'new' | 'read' | 'replied' | 'closed';

interface MessageTableProps {
  messages: Message[];
  onView: (message: Message) => void;
  onDelete: (id: string) => void;
}

export function MessageTable({ messages, onView, onDelete }: MessageTableProps) {
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Liste des messages
          {messages.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({messages.length} message{messages.length > 1 ? 's' : ''})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Contenu</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell>{formatDate(message.createdAt)}</TableCell>
                <TableCell>{message.customerName}</TableCell>
                <TableCell>{message.subject}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    message.status === 'new' ? 'bg-blue-100 text-blue-800' :
                    message.status === 'read' ? 'bg-gray-100 text-gray-800' :
                    message.status === 'replied' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {message.status === 'new' ? 'Nouveau' :
                     message.status === 'read' ? 'Lu' :
                     message.status === 'replied' ? 'Répondu' :
                     'Archivé'}
                  </span>
                </TableCell>
                <TableCell>{message.message}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(message)}
                    className="mr-2"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(message.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {messages.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Aucun message trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 