import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortField, SortOrder } from "./types";

interface FiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  isAvailable: boolean | undefined;
  onAvailabilityChange: (value: boolean | undefined) => void;
  location: string | undefined;
  onLocationChange: (value: string | undefined) => void;
  sortField: SortField;
  onSortFieldChange: (value: SortField) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  availableLocations: (string | null)[];
}

export function FiltersSection({
  search,
  onSearchChange,
  isAvailable,
  onAvailabilityChange,
  location,
  onLocationChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  availableLocations,
}: FiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Filtres</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher une table..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="w-full md:w-[200px]">
            <Select
              value={isAvailable === undefined ? "all" : isAvailable.toString()}
              onValueChange={(value) => {
                if (value === "all") {
                  onAvailabilityChange(undefined);
                } else {
                  onAvailabilityChange(value === 'true');
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrer par disponibilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="true">Disponibles</SelectItem>
                <SelectItem value="false">Occupées</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[200px]">
            <Select
              value={location || "all"}
              onValueChange={v => onLocationChange(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les emplacements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les emplacements</SelectItem>
                {availableLocations.map((loc) => (
                  <SelectItem key={loc} value={loc as string}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[200px]">
            <Select
              value={sortField}
              onValueChange={onSortFieldChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Numéro</SelectItem>
                <SelectItem value="capacity">Capacité</SelectItem>
                <SelectItem value="location">Emplacement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[200px]">
            <Select
              value={sortOrder}
              onValueChange={onSortOrderChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ordre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Croissant</SelectItem>
                <SelectItem value="desc">Décroissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 