import { Search, Calendar, RotateCcw } from 'lucide-react';
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

type MessageStatus = 'new' | 'read' | 'replied' | 'closed';
type FilterStatus = MessageStatus | 'all';
type SortOrder = 'newest' | 'oldest';
type PeriodFilter = 'today' | 'week' | 'month' | 'all';

interface MessageFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: FilterStatus;
  onFilterStatusChange: (value: FilterStatus) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  periodFilter: PeriodFilter;
  onPeriodFilterChange: (value: PeriodFilter) => void;
  selectedDate: string;
  onSelectedDateChange: (value: string) => void;
}

export function MessageFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  sortOrder,
  onSortOrderChange,
  periodFilter,
  onPeriodFilterChange,
  selectedDate,
  onSelectedDateChange,
}: MessageFiltersProps) {
  const handlePeriodChange = (value: PeriodFilter) => {
    onPeriodFilterChange(value);
    // Réinitialiser la date sélectionnée si on change de période
    if (value !== 'all') {
      onSelectedDateChange('');
    }
  };

  const handleDateChange = (value: string) => {
    onSelectedDateChange(value);
    // Si une date est sélectionnée, changer la période à 'all' pour permettre le filtrage par date spécifique
    if (value) {
      onPeriodFilterChange('all');
    }
  };

  const resetFilters = () => {
    onSearchChange('');
    onFilterStatusChange('all');
    onSortOrderChange('newest');
    onPeriodFilterChange('today');
    onSelectedDateChange('');
  };

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || periodFilter !== 'today' || selectedDate;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Filtres</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Première ligne : Recherche et période */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un message..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select
                value={periodFilter ?? "all"}
                onValueChange={handlePeriodChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[200px]">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="pl-10"
                  placeholder="Sélectionner une date"
                />
              </div>
            </div>
          </div>
          
          {/* Deuxième ligne : Statut et tri */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-[200px]">
              <Select
                value={filterStatus}
                onValueChange={(v) => onFilterStatusChange(v as FilterStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="new">Nouveaux</SelectItem>
                  <SelectItem value="read">Lu</SelectItem>
                  <SelectItem value="replied">Répondu</SelectItem>
                  <SelectItem value="closed">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[200px]">
              <Select
                value={sortOrder}
                onValueChange={onSortOrderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Plus récents</SelectItem>
                  <SelectItem value="oldest">Plus anciens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 