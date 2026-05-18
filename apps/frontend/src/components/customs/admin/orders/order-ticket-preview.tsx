import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import QRCode from "qrcode";

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
  const [paperWidth, setPaperWidth] = useState<"57" | "80">("80");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  
  // Générer le QR code
  useEffect(() => {
    if (!order) return;
    
    const qrPayload = {
      id: order.id,
      total: order.total || 0,
      status: order.status,
      type: order.type,
      createdAt: new Date(order.createdAt).toISOString(),
      items: order.orderItems.map((i) => ({ n: i.name, q: i.quantity, p: i.price })),
    };
    
    QRCode.toDataURL(JSON.stringify(qrPayload), { width: 250, margin: 1 })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error("Erreur génération QR code:", err));
  }, [order]);
  
  if (!order) return null;

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
          <Card className="border-2 border-gray-300 bg-white shadow-lg">
            <CardHeader className="text-center pb-3 pt-6">
              <CardTitle className="text-2xl font-bold text-black mb-2">
                APP RESTAURANT
              </CardTitle>
              <p className="text-base text-black font-normal">--- Ticket de Commande ---</p>
            </CardHeader>
            
            <CardContent className="space-y-4 px-6">
              {/* Informations de la commande */}
              <div className="space-y-1 text-sm text-black">
                <div>
                  <span className="font-normal">ID:</span> <span className="font-normal">{order.id.slice(-8).toUpperCase()}</span>
                </div>
                <div>
                  <span className="font-normal">Date:</span> <span className="font-normal">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
                </div>
                <div>
                  <span className="font-normal">Client:</span> <span className="font-normal">{order.user.name || 'Invité'}</span>
                </div>
                <div>
                  <span className="font-normal">Type:</span> <span className="font-normal">{typeLabels[order.type]}</span>
                </div>
                <div>
                  <span className="font-normal">Statut:</span> <span className="font-normal">{statusLabels[order.status]}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-400 pt-4 mt-4"></div>
              
              {/* Articles */}
              <div>
                <h4 className="font-bold text-black mb-2 text-base">ARTICLES COMMANDÉS</h4>
                <div className="border-t border-dashed border-gray-400 pt-3 space-y-3">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm text-black">
                      <span className="font-normal flex-1">{item.quantity} x {item.name}</span>
                      <span className="font-bold ml-4">{formatAmountForPdf(item.price * item.quantity)} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Notes spéciales */}
              {order.specialNotes && (
                <>
                  <div className="border-t border-dashed border-gray-400 pt-3 mt-3"></div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <p className="font-semibold text-black text-sm mb-1">Notes spéciales :</p>
                    <p className="text-sm text-gray-700">{order.specialNotes}</p>
                  </div>
                </>
              )}
              
              <div className="border-t border-gray-400 pt-4 mt-4"></div>
              
              {/* Total breakdown */}
              {order.deliveryFee && order.deliveryFee > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm text-black">
                    <span className="font-normal">Sous-total</span>
                    <span className="font-normal">{formatAmountForPdf((order.total || 0) - order.deliveryFee)} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-black">
                    <span className="font-normal">Frais de livraison</span>
                    <span className="font-normal">{formatAmountForPdf(order.deliveryFee)} FCFA</span>
                  </div>
                  <div className="border-t border-dashed border-gray-400 pt-2 mt-2"></div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-black">
                      TOTAL: {formatAmountForPdf(order.total || 0)} FCFA
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-xl font-bold text-black">
                    TOTAL: {formatAmountForPdf(order.total || 0)} FCFA
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-400 pt-4 mt-4"></div>
              
              {/* QR Code */}
              <div className="flex justify-center py-4">
                <div className="border-2 border-gray-400 p-3 bg-white">
                  {qrCodeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                  ) : (
                    <div className="w-40 h-40 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                      Chargement...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pied de page */}
              <div className="text-center text-base font-bold text-black pt-2 pb-4">
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