import { Button } from "@/components/ui/button";
import { LayoutGrid, Table2 } from "lucide-react";

interface DashboardViewModeToggleProps {
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
}

export function DashboardViewModeToggle({ viewMode, onViewModeChange }: DashboardViewModeToggleProps) {
  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
      <Button
        variant={viewMode === 'cards' ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange('cards')}
        className="flex-1 sm:flex-none"
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant={viewMode === 'table' ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="flex-1 sm:flex-none"
      >
        <Table2 className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Tableau</span>
      </Button>
    </div>
  );
} 