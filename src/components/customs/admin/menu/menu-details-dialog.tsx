import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Calendar, Tag, DollarSign } from "lucide-react";
import Image from "next/image";
import type { MenuItem } from "@/types/menu";

interface MenuDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  onEdit: () => void;
}

export function MenuDetailsDialog({
  isOpen,
  onOpenChange,
  item,
  onEdit,
}: MenuDetailsDialogProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Détails du plat</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="ml-auto"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Image et informations principales */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                {item.image ? (
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-gray-200 rounded-lg border flex items-center justify-center">
                    <span className="text-gray-400">Aucune image</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                  <p className="text-gray-600 mt-2">{item.description}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-lg">{formatPrice(item.price)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">{item.category.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-700">
                      Créé le {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Badge 
                    className={item.isAvailable ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                  >
                    {item.isAvailable ? "Disponible" : "Indisponible"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Informations détaillées */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Informations détaillées</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Nom du plat</p>
                      <p className="text-gray-900">{item.name}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Catégorie</p>
                      <p className="text-gray-900">{item.category.name}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Prix</p>
                      <p className="text-gray-900 font-semibold">{formatPrice(item.price)}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Statut</p>
                      <Badge 
                        className={item.isAvailable ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                      >
                        {item.isAvailable ? "Disponible" : "Indisponible"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-gray-900">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 