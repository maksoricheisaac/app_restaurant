import { ListTree, ArrowUpDown, ChevronDown, Settings, Trash } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";

interface Category {
  id: string;
  name: string;
  _count: {
    items: number;
  };
}

interface CategoryTableProps {
  categories: Category[];
  isLoading: boolean;
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
  sortBy: 'name' | 'items';
  sortOrder: 'asc' | 'desc';
  onSort: (column: 'name' | 'items') => void;
  onEdit: (category: { id: string; name: string }) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export function CategoryTable({
  categories,
  isLoading,
  pagination,
  onSort,
  onEdit,
  onDelete,
  onPageChange,
}: CategoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ListTree className="h-5 w-5 mr-2" />
          Liste des catégories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => onSort('name')}
                    className="flex items-center space-x-2"
                  >
                    Nom
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => onSort('items')}
                    className="flex items-center space-x-2"
                  >
                    Nombre d&apos;articles
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Aucune catégorie trouvée
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category._count.items}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(category)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onDelete(category.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && (
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="text-sm text-gray-500">
              Total: {pagination.total} catégories
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 