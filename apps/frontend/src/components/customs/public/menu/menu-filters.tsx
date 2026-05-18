import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MenuFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryOptions: string[];
  sortBy: 'name' | 'price';
  onSortByChange: (value: 'name' | 'price') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export function MenuFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categoryOptions,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: MenuFiltersProps) {
  return (
    <div className="mb-10 sm:mb-16 flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 pr-4 py-2 sm:py-3 w-full border-2 border-gray-200 focus:border-orange-500 rounded-xl bg-white/80 backdrop-blur-sm text-sm sm:text-base"
        />
      </div>

      <div className="flex gap-2 sm:gap-4">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-48 border-2 border-gray-200 focus:border-orange-500 rounded-xl bg-white/80 backdrop-blur-sm text-sm sm:text-base">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((category) => (
              <SelectItem key={category} value={category} className="text-sm sm:text-base">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-32 border-2 border-gray-200 focus:border-orange-500 rounded-xl bg-white/80 backdrop-blur-sm text-sm sm:text-base">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="price">Prix</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={onSortOrderChange}>
          <SelectTrigger className="w-32 border-2 border-gray-200 focus:border-orange-500 rounded-xl bg-white/80 backdrop-blur-sm text-sm sm:text-base">
            <SelectValue placeholder="Ordre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Croissant</SelectItem>
            <SelectItem value="desc">Décroissant</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 