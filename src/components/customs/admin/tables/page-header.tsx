import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  onAddClick: () => void;
}

export function PageHeader({ onAddClick }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tables</h1>
        <p className="text-gray-500 mt-2">
          Gérez les tables de votre restaurant
        </p>
      </div>
      <Button onClick={onAddClick} className="cursor-pointer">
        <Plus className="mr-2 h-4 w-4" />
        Ajouter une table
      </Button>
    </div>
  );
} 