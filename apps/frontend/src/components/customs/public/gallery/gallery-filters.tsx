import { Grid, List, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GalleryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: 'grid' | 'masonry';
  onViewModeChange: (mode: 'grid' | 'masonry') => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export function GalleryFilters({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: GalleryFiltersProps) {
  return (
    <div className="space-y-6 mb-8 sm:mb-12">
      {/* Header avec titre et statistiques */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Notre Galerie
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Découvrez l&apos;ambiance et les saveurs de notre restaurant
        </p>
      </div>

      {/* Barre de recherche principale */}
      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Rechercher une photo, un plat ou une ambiance..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-4 py-3 sm:py-4 text-base border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Contrôles et filtres */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-center lg:justify-between">
        {/* Filtres par catégorie */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Filtrer par :</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => onCategoryChange(category)}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'transition-all duration-300 rounded-xl px-3 sm:px-4 py-2 text-sm font-medium',
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg transform scale-105'
                    : 'border-2 border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:border-orange-300 hover:text-orange-600 hover:scale-105 bg-white/80 backdrop-blur-sm'
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Contrôles d'affichage */}
        <div className="flex items-center gap-4">
          {/* Sélecteur de tri */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">Trier :</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 bg-white/80 backdrop-blur-sm transition-all duration-300"
            >
              <option value="category">Par catégorie</option>
              <option value="title">Par titre</option>
            </select>
          </div>

          {/* Sélecteur de vue */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">Vue :</span>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
              <Button
                onClick={() => onViewModeChange('grid')}
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-lg transition-all duration-300',
                  viewMode === 'grid'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                )}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onViewModeChange('masonry')}
                variant={viewMode === 'masonry' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-lg transition-all duration-300',
                  viewMode === 'masonry'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur de résultats */}
      {searchTerm && (
        <div className="text-center py-2">
          <span className="text-sm text-gray-600">
            Recherche pour : <span className="font-medium text-orange-600">&ldquo;{searchTerm}&rdquo;</span>
          </span>
        </div>
      )}
    </div>
  );
}
