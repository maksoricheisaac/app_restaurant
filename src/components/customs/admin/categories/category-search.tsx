import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategorySearchProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function CategorySearch({ search, onSearchChange }: CategorySearchProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center">
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          Rechercher
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Rechercher des catégories..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </CardContent>
    </Card>
  );
} 