import type { MenuItem as MenuItemType } from '@/actions/public/menu-actions';
import { MenuItem } from './menu-item';

interface MenuCategoryProps {
  category: string;
  dishes: MenuItemType[];
  onOrder: (dish: MenuItemType) => void;
  formatPrice: (price: number) => string;
}

export function MenuCategory({ category, dishes, onOrder, formatPrice }: MenuCategoryProps) {
  return (
    <div className="mb-8 sm:mb-12 lg:mb-16 last:mb-0 relative z-10">
      {/* En-tête de catégorie */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-3 lg:space-x-4 mb-4 sm:mb-6 lg:mb-8">
        <div className="h-px w-4 sm:w-6 lg:w-8 bg-orange-200 flex-shrink-0"></div>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif text-orange-900 text-center px-2 sm:px-4">
          {category}
        </h3>
        <div className="h-px w-4 sm:w-6 lg:w-8 bg-orange-200 flex-shrink-0"></div>
      </div>
      
      {/* Liste des plats */}
      <div className="space-y-2 sm:space-y-3">
        {dishes.map((dish) => (
          <MenuItem
            key={dish.id}
            dish={dish}
            onOrder={onOrder}
            formatPrice={formatPrice}
          />
        ))}
      </div>
    </div>
  );
}