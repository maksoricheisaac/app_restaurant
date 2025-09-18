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

type CustomerStatus = "active" | "inactive" | "vip";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  image: string | null;
  role: string;
  _count: {
    orders: number;
  };
}

const statusColors = {
  active: "bg-green-500",
  inactive: "bg-gray-500",
  vip: "bg-purple-500",
} as const;

const statusLabels = {
  active: "Actif",
  inactive: "Inactif",
  vip: "VIP",
} as const;

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit?: (customer: Customer) => void;
  onDelete?: (id: string) => void;
}

export function CustomerTable({
  customers,
  isLoading,
  onAdd,
}: CustomerTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Liste des clients
          {customers.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({customers.length} client{customers.length > 1 ? 's' : ''})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>Chargement des clients...</p>
          </div>
        ) : !customers || customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-4">
            <p className="text-muted-foreground">Aucun client trouvé</p>
            <Button onClick={onAdd}>Créer votre premier client</Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d&apos;inscription</TableHead>
                  <TableHead>Commandes</TableHead>
                  {/* <TableHead>Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[customer.status as CustomerStatus]}>
                        {statusLabels[customer.status as CustomerStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>{customer._count.orders}</TableCell>
                    {/* <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(customer)}
                        >
                          Modifier 
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(customer.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </TableCell> */}
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