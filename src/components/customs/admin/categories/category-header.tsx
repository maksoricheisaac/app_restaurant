import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryHeaderProps {
  onAdd: () => void;
}

export function CategoryHeader({ onAdd }: CategoryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Catégories</h1>
        <p className="text-gray-600 mt-2">
          Gérez les catégories de votre menu ici
        </p>
      </div>
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4 cursor-pointer" />
        Ajouter une catégorie
      </Button>
    </div>
  );
} 