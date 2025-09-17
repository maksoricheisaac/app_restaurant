import { Search, CalendarIcon, AlertCircle, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { validateDateRange, formatDateRangeForDisplay } from "@/utils/dateValidation";
import { useState } from "react";

interface FiltersProps {
  search: string;
  setSearch: (value: string) => void;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled" | undefined;
  setStatus: (value: "pending" | "preparing" | "ready" | "served" | "cancelled" | undefined) => void;
  type: "dine_in" | "takeaway" | "delivery" | undefined;
  setType: (value: "dine_in" | "takeaway" | "delivery" | undefined) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date) => void;
  sort: "date" | "total" | "status" | "createdAt";
  setSort: (value: "date" | "total" | "status" | "createdAt") => void;
  order: "asc" | "desc";
  setOrder: (value: "asc" | "desc") => void;
  isLoading?: boolean;
}

export function FiltersSection({
  search,
  setSearch,
  status,
  setStatus,
  type,
  setType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  sort,
  setSort,
  order,
  setOrder,
  isLoading = false,
}: FiltersProps) {
  const [dateError, setDateError] = useState<string | undefined>();


  const resetToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    setStartDate(today);
    setEndDate(endOfDay);
    setDateError(undefined);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Filtres</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher une commande..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={status ?? "all"}
            onValueChange={v => setStatus(v === "all" ? undefined : v as "pending" | "preparing" | "ready" | "served" | "cancelled")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="preparing">En préparation</SelectItem>
              <SelectItem value="ready">Prête</SelectItem>
              <SelectItem value="served">Servie</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={type ?? "all"}
            onValueChange={v => setType(v === "all" ? undefined : v as "dine_in" | "takeaway" | "delivery")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="dine_in">Sur place</SelectItem>
              <SelectItem value="takeaway">À emporter</SelectItem>
              <SelectItem value="delivery">Livraison</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRangeForDisplay(startDate, endDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: startDate,
                  to: endDate,
                }}
                onSelect={(range) => {
                  if (range) {
                    const validation = validateDateRange(range.from, range.to);
                    if (validation.isValid) {
                      if (range.from) setStartDate(range.from);
                      if (range.to) setEndDate(range.to);
                      setDateError(undefined);
                    } else {
                      setDateError(validation.error);
                    }
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            onClick={resetToToday}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Aujourd&apos;hui
          </Button>
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as typeof sort)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="createdAt">Date de création</SelectItem>
              <SelectItem value="total">Total</SelectItem>
              <SelectItem value="status">Statut</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
            disabled={isLoading}
          >
            {order === "asc" ? "↑" : "↓"}
          </Button>
        </div>
        {dateError && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dateError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 