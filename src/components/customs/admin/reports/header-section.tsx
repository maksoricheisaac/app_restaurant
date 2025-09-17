import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderSectionProps {
  selectedPeriod: string;
  setSelectedPeriod: (value: string) => void;
  selectedDate?: string;
  setSelectedDate?: (date: string | undefined) => void;
}

export function HeaderSection({
  selectedPeriod,
  setSelectedPeriod,
  selectedDate,
  setSelectedDate,
}: HeaderSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Rapports</h1>
        <p className="text-gray-600">Statistiques du restaurant</p>
      </div>
      <div className="flex items-center space-x-3">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32 border-2 border-gray-200 focus:border-orange-500 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Journalier</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuel</SelectItem>
            <SelectItem value="yearly">Annuel</SelectItem>
          </SelectContent>
        </Select>
        
        {setSelectedDate && (
          <Input
            type="date"
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value || undefined)}
            className="w-40 border-2 border-gray-200 focus:border-orange-500 rounded-xl"
          />
        )}
      </div>
    </div>
  );
} 