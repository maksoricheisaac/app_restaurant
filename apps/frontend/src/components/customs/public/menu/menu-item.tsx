import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import type { MenuItem as MenuItemType } from '@/actions/public/menu-actions';

interface MenuItemProps {
  dish: MenuItemType;
  onOrder: (dish: MenuItemType) => void;
  formatPrice: (price: number) => string;
}

export function MenuItem({ dish, onOrder, formatPrice }: MenuItemProps) {
  return (
    <div className="group hover:bg-orange-50/50 rounded-xl px-2 sm:px-3 lg:px-4 py-2 sm:py-3 -mx-2 sm:-mx-3 lg:-mx-4 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full">
        {/* Image du plat */}
        <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
          {dish.image ? (
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-300">
              <OptimizedImage
                src={dish.image}
                alt={dish.name}
                width={112}
                height={112}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, (max-width: 1024px) 96px, 112px"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
              <div className="text-gray-400 text-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium hidden sm:block">Aucune image</span>
              </div>
            </div>
          )}
        </div>

        {/* Contenu du plat */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-x-4">
            <h4 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900 group-hover:text-orange-800 transition-colors text-center sm:text-left">
              {dish.name}
            </h4>
            <span className="text-base sm:text-lg lg:text-xl font-medium text-orange-600 whitespace-nowrap text-center sm:text-right">
              {formatPrice(dish.price)}
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 leading-relaxed text-center sm:text-left">
            {dish.description}
          </p>
        </div>

        {/* Bouton Commander */}
        <div className="w-full sm:w-auto flex justify-center sm:justify-end">
          <Button
            onClick={() => onOrder(dish)}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto opacity-90 group-hover:opacity-100 transition-all duration-300 text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-xl text-sm sm:text-base whitespace-nowrap px-4 sm:px-6 py-2"
          >
            Commander
          </Button>
        </div>
      </div>
    </div>
  );
}