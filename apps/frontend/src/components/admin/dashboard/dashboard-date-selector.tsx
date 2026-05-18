import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DashboardDateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DashboardDateSelector({ selectedDate, onDateChange }: DashboardDateSelectorProps) {
  return (
    <div className="flex items-center space-x-4">
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="w-auto"
      />
      <p className="text-sm text-gray-500">
        Statistiques du {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
      </p>
    </div>
  );
} 