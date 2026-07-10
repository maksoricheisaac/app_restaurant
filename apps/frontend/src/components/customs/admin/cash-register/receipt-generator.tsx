"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeFormat } from "@/lib/utils";
import { fr } from "date-fns/locale";
import { Download, Printer } from "lucide-react";
import type { PaymentLike } from "@/lib/pdf/receipt";
import { useTenant } from "@/contexts/TenantContext";
import { useSettings } from "@/hooks/api/useSettings";

interface ReceiptGeneratorProps {
  payment: PaymentLike;
  formatCurrency: (amount: number) => string;
}

export function ReceiptGenerator({ payment, formatCurrency }: ReceiptGeneratorProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { tenant } = useTenant();
  const { data: settings } = useSettings();

  const restaurantInfo = tenant ? {
    name:         tenant.name,
    logoUrl:      tenant.logo,
    primaryColor: tenant.primaryColor,
    phone:        (settings as any)?.phone ?? null,
    email:        (settings as any)?.email ?? null,
    address:      (settings as any)?.address ?? null,
  } : undefined;

  const generatePDF = async () => {
    try {
      const { generateReceiptPdf } = await import("@/lib/pdf/receipt");
      await generateReceiptPdf(payment, { restaurant: restaurantInfo });
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
    }
  };

  const printReceipt = async () => {
    try {
      const { generateReceiptPdf } = await import("@/lib/pdf/receipt");
      await generateReceiptPdf(payment, { openInsteadOfDownload: true, restaurant: restaurantInfo });
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
            {tenant?.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo} alt={tenant?.name} className="h-12 w-12 object-contain rounded-lg mx-auto mb-2" />
            )}
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {tenant?.name ?? 'Votre Restaurant'}
            </h1>
            {((settings as any)?.phone || (settings as any)?.email) && (
              <p className="text-xs text-gray-500 mb-1">
                {[(settings as any)?.phone, (settings as any)?.email].filter(Boolean).join(' • ')}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {safeFormat(payment.createdAt, "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
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
            {payment.order.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm mb-1">
                <span>{item.quantity}× {item.menuItem?.name || ""}</span>
                <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-300 pt-4 mb-4">
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL</span>
              <span>{formatCurrency(Number(payment.amount))}</span>
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
              <span>{payment.cashier?.name ?? '—'}</span>
            </div>
          </div>

          {/* Pied de page */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4 space-y-0.5">
            <p className="font-semibold">Merci pour votre visite !</p>
            <p>Nous espérons vous revoir bientôt</p>
            {(settings as any)?.phone && <p>Tél : {(settings as any).phone}</p>}
            {(settings as any)?.email && <p>Email : {(settings as any).email}</p>}
            {(settings as any)?.address && <p>{(settings as any).address}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 