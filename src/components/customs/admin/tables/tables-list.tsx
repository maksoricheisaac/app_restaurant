import { Table2, QrCode } from "lucide-react";
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
import { TableData } from "./types";
import { Plus } from "lucide-react";

interface TablesListProps {
  tables: TableData[];
  isLoading: boolean;
  onEdit: (table: TableData) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onQRCode: (table: TableData) => void;
}

export function TablesList({
  tables,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
  onQRCode,
}: TablesListProps) {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center space-y-4">
          <Table2 className="h-12 w-12 text-gray-400 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">Aucune table disponible</h3>
            <p className="text-gray-500 max-w-sm">
              Vous n&apos;avez pas encore ajouté de tables. Commencez par en créer une.
            </p>
          </div>
          <Button onClick={onAdd} variant="outline" className="mt-4 cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter votre première table
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Liste des tables
          {tables.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({tables.length} table{tables.length > 1 ? 's' : ''})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Capacité</TableHead>
              <TableHead>Emplacement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Commandes</TableHead>
              <TableHead>Réservations</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <span className="ml-3 text-gray-600">Chargement...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell>Table {table.number}</TableCell>
                  <TableCell>{table.seats} places</TableCell>
                  <TableCell>{table.location || "Non spécifié"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        table.status === "available"
                          ? "bg-green-500"
                          : table.status === "occupied"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }
                    >
                      {table.status === "available" ? "Disponible" : 
                       table.status === "occupied" ? "Occupée" : "Réservée"}
                    </Badge>
                  </TableCell>
                  <TableCell>{table._count.orders}</TableCell>
                  <TableCell>{table._count.reservations}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onQRCode(table)}
                        className="flex items-center space-x-1"
                      >
                        <QrCode className="h-3 w-3" />
                        <span>QR</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(table)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(table.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 