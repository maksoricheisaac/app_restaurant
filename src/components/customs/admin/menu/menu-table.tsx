import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import type { MenuItem } from "@/types/menu";

interface MenuTableProps {
  items: MenuItem[];
  isLoading: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onViewDetails: (item: MenuItem) => void;
}

export function MenuTable({
  items,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
  onViewDetails,
}: MenuTableProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Liste des plats
          {items.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({items.length} plat{items.length > 1 ? 's' : ''})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>Chargement des plats...</p>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-4">
            <p className="text-muted-foreground">Aucun plat trouvé</p>
            <Button onClick={onAdd} className="cursor-pointer">Ajouter votre premier plat</Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No img</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category.name}</TableCell>
                    <TableCell>{formatPrice(item.price)}</TableCell>
                    <TableCell>
                      <Badge className={item.isAvailable ? "bg-green-500" : "bg-red-500"}>
                        {item.isAvailable ? "Disponible" : "Indisponible"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(item)}
                          title="Voir les informations"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item)}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(item.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 