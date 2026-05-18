 
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Copy } from "lucide-react";
import QRCode from "react-qr-code";
import QRCodeLib from "qrcode";
import { TableData } from "./types";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableData | null;
}
export function QRCodeDialog({ isOpen, onClose, table }: QRCodeDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { tenant } = useTenant();

  if (!table) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  // Use slug-based URL so the public menu page can resolve correctly
  const menuPath = tenant?.slug
    ? `/menu/${tenant.slug}?tableId=${table.id}`
    : `/menu?tableId=${table.id}`;
  const qrData = `${baseUrl}${menuPath}`;

  // Fonction pour télécharger l'image QR code
  const downloadAsImage = async () => {
    setIsGenerating(true);
    try {
      // Générer le QR code directement avec la bibliothèque qrcode
      const dataUrl = await QRCodeLib.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `table-${table.number}-qr.png`;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Image téléchargée avec succès !");
    } catch (error) {
      void error
      toast.error("Erreur lors du téléchargement de l'image.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour télécharger le QR code en SVG
  const downloadAsSVG = async () => {
    setIsGenerating(true);
    try {
    
      
      // Générer le QR code en SVG
      const svgString = await QRCodeLib.toString(qrData, {
        type: 'svg',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      
      // Créer un blob avec le SVG
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `table-${table.number}-qr.svg`;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      toast.success("SVG téléchargé avec succès !");
    } catch (error) {
      void error
      toast.error("Erreur lors du téléchargement du SVG.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour télécharger le QR code en PDF (en utilisant l'image générée)
  const downloadAsPDF = async () => {
    setIsGenerating(true);
    try {
     
      
      // Générer le QR code en image
      const dataUrl = await QRCodeLib.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      
      // Créer une image pour obtenir les dimensions
      const img = new window.Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Créer un canvas pour le PDF
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 1000;
      
      if (ctx) {
        // Fond blanc
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Titre
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`QR Code - Table ${table.number}`, canvas.width / 2, 50);
        
        // Informations de la table
        ctx.font = '16px Arial';
        ctx.fillText(`${table.location || 'Non spécifié'} • ${table.seats} places`, canvas.width / 2, 80);
        
        // QR Code
        const qrSize = 300;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = 120;
        
        const qrImg = new window.Image();
        qrImg.src = dataUrl;
        
        await new Promise((resolve) => {
          qrImg.onload = () => {
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            resolve(null);
          };
        });
        
        // Instructions
        ctx.font = '14px Arial';
        ctx.fillText('Scannez pour accéder à la table', canvas.width / 2, qrY + qrSize + 40);
        ctx.font = '12px Arial';
        ctx.fillText(`ID: ${table.id}`, canvas.width / 2, qrY + qrSize + 60);
        
        // Convertir en blob et télécharger
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `table-${table.number}-qr.pdf`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            toast.success("PDF téléchargé avec succès !");

          }
        }, 'image/png', 1.0);
      }
    } catch (error) {
      void error
      toast.error("Erreur lors du téléchargement du PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - Table {table.number}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex flex-col items-center space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Table {table.number}
              </h3>
              <p className="text-sm text-gray-600">
                {table.location || 'Non spécifié'} • {table.seats} places
              </p>
            </div>
            
            <QRCode
              value={qrData}
              size={200}
              level="H"
              fgColor="#000000"
              bgColor="#ffffff"
            />
            
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500">Scannez pour accéder au menu</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrData);
                  toast.success('URL copiée');
                }}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Copy className="h-3 w-3" />
                {menuPath}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={downloadAsImage}
              disabled={isGenerating}
              variant="default"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isGenerating ? "Génération..." : "Image PNG"}</span>
            </Button>
            
            <Button
              onClick={downloadAsSVG}
              disabled={isGenerating}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>{isGenerating ? "Génération..." : "SVG"}</span>
            </Button>
            
            <Button
              onClick={downloadAsPDF}
              disabled={isGenerating}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>{isGenerating ? "Génération..." : "PDF"}</span>
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 text-center">
            <p>💡 Tous les formats utilisent la bibliothèque qrcode pour une meilleure fiabilité</p>
            <p>• PNG : Image haute qualité</p>
            <p>• SVG : Vectoriel, redimensionnable</p>
            <p>• PDF : Document avec mise en page</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 