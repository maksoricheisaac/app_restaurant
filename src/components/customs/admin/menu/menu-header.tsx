import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuHeaderProps {
  onAdd: () => void;
}

export function MenuHeader({ onAdd }: MenuHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
        <p className="text-gray-500 mt-2">
          Gérez les plats et les boissons de votre menu
        </p>
      </div>
      <Button onClick={onAdd} className="bg-orange-600 hover:bg-orange-700 cursor-pointer">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un plat
      </Button>
    </div>
  );
} 