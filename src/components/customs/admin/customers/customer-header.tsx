import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomerHeaderProps {
  onAdd: () => void;
}

export function CustomerHeader({ onAdd }: CustomerHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="text-gray-500 mt-2">
          Gérez vos clients et leurs informations
        </p>
      </div>
      <Button onClick={onAdd} className="bg-orange-600 hover:bg-orange-700">
        <Plus className="h-4 w-4 mr-2" />
        Nouveau Client
      </Button>
    </div>
  );
} 