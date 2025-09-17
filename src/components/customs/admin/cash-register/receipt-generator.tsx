"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, Printer } from "lucide-react";
import { generateReceiptPdf } from "@/lib/pdf/receipt";

interface ReceiptGeneratorProps {
  payment: any;
  formatCurrency: (amount: number) => string;
}

export function ReceiptGenerator({ payment, formatCurrency }: ReceiptGeneratorProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    try {
      await generateReceiptPdf(payment);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
    }
  };

  const printReceipt = async () => {
    try {
      await generateReceiptPdf(payment, { openInsteadOfDownload: true });
    } catch (error) {
      console.error("Erreur lors de l'ouverture du PDF pour impression:", error);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Espèces";
      case "mobile_money":
        return "Mobile Money";
      case "card":
        return "Carte";
      case "bank_transfer":
        return "Virement";
      default:
        return method;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={generatePDF} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Télécharger PDF
        </Button>
        <Button onClick={printReceipt} variant="outline" className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Imprimer
        </Button>
      </div>

      <Card ref={receiptRef} className="max-w-md mx-auto bg-white">
        <CardContent className="p-6">
          {/* En-tête */}
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              RESTAURANT MBOKA TECH
            </h1>
            <p className="text-sm text-gray-600 mb-2">
              Votre restaurant de confiance
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(payment.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>

          {/* Informations de la commande */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Commande #{payment.order.id.slice(-6).toUpperCase()}</span>
              <Badge variant="outline">Payée</Badge>
            </div>
            
            {payment.order.customer && (
              <div className="text-sm text-gray-600 mb-2">
                Client: {payment.order.customer.name}
              </div>
            )}
            
            {payment.order.table && (
              <div className="text-sm text-gray-600 mb-2">
                Table: {payment.order.table.number}
              </div>
            )}
          </div>

          {/* Articles */}
          <div className="mb-4">
            <div className="font-semibold mb-2">Articles commandés:</div>
            {payment.order.orderItems.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm mb-1">
                <span>{item.quantity}× {item.menuItem.name}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-300 pt-4 mb-4">
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL</span>
              <span>{formatCurrency(payment.amount)}</span>
            </div>
          </div>

          {/* Informations de paiement */}
          <div className="mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span>Méthode de paiement:</span>
              <span>{getPaymentMethodLabel(payment.method)}</span>
            </div>
            {payment.reference && (
              <div className="flex justify-between mb-1">
                <span>Référence:</span>
                <span className="font-mono">{payment.reference}</span>
              </div>
            )}
            <div className="flex justify-between mb-1">
              <span>Caissier:</span>
              <span>{payment.cashier.name}</span>
            </div>
          </div>

          {/* Pied de page */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>Merci pour votre visite !</p>
            <p>Nous espérons vous revoir bientôt</p>
            <p className="mt-2">
              Tél: +237 XXX XXX XXX | Email: contact@mbokatech.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 