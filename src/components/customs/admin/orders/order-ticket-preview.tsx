import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer } from "lucide-react";
import { generateOrderTicketPdf } from "@/lib/pdf/order-ticket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Order, OrderStatus, OrderType } from "@/types/order";

interface OrderTicketPreviewProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
  statusLabels: Record<OrderStatus, string>;
  typeLabels: Record<OrderType, string>;
}

export function OrderTicketPreview({
  order,
  isOpen,
  onClose,
  statusLabels,
  typeLabels,
}: OrderTicketPreviewProps) {
  if (!order) return null;

  const [paperWidth, setPaperWidth] = useState<"57" | "80">("80");

  const formatAmountForPdf = (amount: number) => {
    // 3 500 style with normal spaces, no currency symbol
    const formatted = Math.round(amount)
      .toLocaleString("fr-FR", { useGrouping: true })
      .replace(/\u00A0/g, " ");
    return formatted;
  };

  const handlePrintPDF = async () => {
    try {
      await generateOrderTicketPdf({
        order,
        paperWidth,
        statusLabels: statusLabels as Record<string, string>,
        typeLabels: typeLabels as Record<string, string>,
        fileName: `commande_${order.id}.pdf`,
      });
      onClose();
    } catch (e) {
      console.error("Erreur lors de la génération du PDF de commande:", e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Prévisualisation du Ticket</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Options d'impression */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Largeur papier</div>
            <div className="w-40">
              <Select value={paperWidth} onValueChange={(v) => setPaperWidth(v as "57" | "80")}> 
                <SelectTrigger>
                  <SelectValue placeholder="80 mm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="57">57 mm</SelectItem>
                  <SelectItem value="80">80 mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* En-tête du ticket */}
          <Card className="border-2 border-orange-100">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold text-orange-700">
                APP RESTAURANT
              </CardTitle>
              <p className="text-sm text-gray-600">Ticket de Commande</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Informations de la commande */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{fontSize: "semibold"}}>ID:</span> {order.id}
                </div>
                <div>
                  <span style={{fontSize: "semibold"}}>Date:</span> {format(new Date(order.createdAt), "d MMMM yyyy", { locale: fr })} à {order.createdAt.toTimeString().split(" ")[0]}
                </div>
                <div>
                  <span style={{fontSize: "semibold"}}>Client:</span> {order.user.name || 'Invité'}
                </div>
                <div>
                  <span style={{fontSize: "semibold"}}>Email:</span> {order.user.email}
                </div>
                {order.user.phone && (
                  <div>
                    <span style={{fontSize: "semibold"}}>Téléphone:</span> {order.user.phone}
                  </div>
                )}
                {order.table && (
                  <div>
                    <span style={{fontSize: "semibold"}}>Table:</span> {order.table.number}
                  </div>
                )}
                <div>
                  <span style={{fontSize: "semibold"}}>Type:</span> {typeLabels[order.type]}
                </div>
                <div>
                  <span style={{fontSize: "semibold"}}>Statut:</span> 
                  <Badge className="ml-2">{statusLabels[order.status]}</Badge>
                </div>
              </div>
              
              <Separator />
              
              {/* Articles */}
              <div>
                <h4 className="font-semibold mb-3">Articles:</h4>
                <div className="space-y-2">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>{item.quantity}× {item.name}</span>
                      <span className="font-medium">{formatAmountForPdf(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Total */}
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-orange-600">{formatAmountForPdf(order.total || 0)}</span>
              </div>
              
              {/* Pied de page */}
              <div className="text-center text-sm text-gray-500 pt-4">
                Merci de votre visite !
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handlePrintPDF} className="bg-orange-600 hover:bg-orange-700 cursor-pointer">
              <Printer className="mr-2 h-4 w-4" />
              Imprimer PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}