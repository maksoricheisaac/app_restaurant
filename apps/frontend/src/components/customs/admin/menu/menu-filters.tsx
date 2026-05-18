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

interface Category {
  id: string;
  name: string;
}

interface MenuFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | undefined;
  onCategoryChange: (value: string) => void;
  categories: Category[];
  sort: "name" | "price" | "category" | "createdAt";
  onSortChange: (value: "name" | "price" | "category" | "createdAt") => void;
  order: "asc" | "desc";
  onOrderChange: () => void;
  isLoading?: boolean;
}

export function MenuFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sort,
  onSortChange,
  order,
  onOrderChange,
  isLoading = false,
}: MenuFiltersProps) {
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
              placeholder="Rechercher un plat..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory ?? "all"} onValueChange={v => onCategoryChange(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="price">Prix</SelectItem>
              <SelectItem value="category">Catégorie</SelectItem>
              <SelectItem value="createdAt">Date de création</SelectItem>
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