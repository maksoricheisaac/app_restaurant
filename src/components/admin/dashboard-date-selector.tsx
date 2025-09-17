import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React from "react";

interface DashboardDateSelectorProps {
  selectedDate: string;
  onChange: (date: string) => void;
}

export const DashboardDateSelector: React.FC<DashboardDateSelectorProps> = ({ selectedDate, onChange }) => (
  <div className="flex items-center space-x-4">
    <Input
      type="date"
      value={selectedDate}
      onChange={(e) => onChange(e.target.value)}
      className="w-auto"
    />
    <p className="text-sm text-gray-500">
      Statistiques du {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
    </p>
  </div>
); 