import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CustomerStatus = "active" | "inactive" | "vip";
type SortField = "name" | "email" | "status" | "createdAt";

interface CustomerFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: CustomerStatus | undefined;
  onStatusChange: (value: CustomerStatus | undefined) => void;
  sort: SortField;
  onSortChange: (value: SortField) => void;
  order: "asc" | "desc";
  onOrderChange: () => void;
  isLoading?: boolean;
}

export function CustomerFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  order,
  onOrderChange,
  isLoading = false,
}: CustomerFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Filtres</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={status ?? "all"} onValueChange={v => onStatusChange(v === "all" ? undefined : v as CustomerStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="status">Statut</SelectItem>
              <SelectItem value="createdAt">Date d&apos;inscription</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={onOrderChange}
            disabled={isLoading}
          >
            {order === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 