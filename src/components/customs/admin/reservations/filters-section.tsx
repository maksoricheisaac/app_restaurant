import { Search, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';
type FilterStatus = ReservationStatus | 'all' | undefined;
type SortOrder = 'date-desc' | 'date-asc' | 'guests-desc' | 'guests-asc';

interface FiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: FilterStatus;
  onStatusChange: (value: FilterStatus) => void;
  filterDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  sortOrder: SortOrder;
  onSortChange: (value: SortOrder) => void;
}

export function FiltersSection({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterDate,
  onDateChange,
  sortOrder,
  onSortChange,
}: FiltersProps) {
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
              placeholder="Rechercher une réservation..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-[200px]">
            <Select
              value={filterStatus ?? "all"}
              onValueChange={v => onStatusChange(v === "all" ? undefined : v as ReservationStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[200px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, 'P', { locale: fr }) : 'Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={onDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-full md:w-[200px]">
            <Select
              value={sortOrder}
              onValueChange={onSortChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (récent)</SelectItem>
                <SelectItem value="date-asc">Date (ancien)</SelectItem>
                <SelectItem value="guests-desc">Personnes (décroissant)</SelectItem>
                <SelectItem value="guests-asc">Personnes (croissant)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 