
'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { usePerformance } from '@/hooks/usePerformance';
import { useQuery } from '@tanstack/react-query';
import { getPublicMenu, getPublicCategories, type MenuItem } from "@/actions/public/menu-actions";
import { getTableById } from '@/actions/public/order-actions';
import { MenuHero } from '@/components/customs/public/menu/hero';
import { MenuFilters } from '@/components/customs/public/menu/menu-filters';
import { MenuHeader } from '@/components/customs/public/menu/menu-header';
import { MenuCategory } from '@/components/customs/public/menu/menu-category';
import { StructuredData } from '@/components/seo/structured-data';
import { useSession } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const fetchCategories = async () => {
  const result = await getPublicCategories();
  if(!result.data) throw new Error("Catégories non trouvées")
  return result.data;
}

const fetchMenu = async({search, categoryId, sortBy, sortOrder}: {search?: string, categoryId?: string, sortBy: "name" | "price", sortOrder: "asc" | "desc"}) => {
  const result = await getPublicMenu({search, categoryId, sortBy, sortOrder});
  if(!result.data) throw new Error("Plats non trouvés")
  return result.data;
}

export default function Menu() {
  usePerformance('MenuPage');
  
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const { addItem, setTableInfo } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tableIdFromUrl = searchParams.get('tableId');
    if (tableIdFromUrl) {
      const fetchTableInfo = async () => {
        try {
          const result = await getTableById({ tableId: tableIdFromUrl });
          if (result.data?.table) {
            setTableInfo(result.data.table.id, result.data.table.number);
            toast.info(`Vous êtes à la table n°${result.data.table.number}.`);
          } else {
            toast.error("La table scannée n'a pas été trouvée.");
          }
        } catch {
          toast.error("Erreur lors de la récupération des informations de la table.");
        }
      };

      fetchTableInfo();
    }
  }, [searchParams, setTableInfo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleSortByChange = (value: 'name' | 'price') => {
    setSortBy(value);
  };

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    setSortOrder(value);
  };

  const { data : categories } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: fetchCategories
  });

  const { data: menuItems, error } = useQuery({
    queryKey: ['menu-items', debouncedSearchTerm, selectedCategory, sortBy, sortOrder],
    queryFn: () => {
      const categoryId = selectedCategory !== 'Tous' 
        ? categories?.data.find((cat) => cat.name === selectedCategory)?.id
        : undefined;
      
      return fetchMenu({
        search: debouncedSearchTerm.trim() || undefined,
        categoryId,
        sortBy,
        sortOrder
      });
    },
    enabled: !!categories,
    retry: 1,
    retryDelay: 1000,
  });

  const availableCategories = useMemo(() => {
    if (!categories) return ['Tous'];
    
    return ['Tous', ...categories.data.map((cat) => cat.name)];
  }, [categories]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(price);
  }, []);

  const handleAddToCart = useCallback((dish: MenuItem) => {
    if (!session?.user) {
      toast.error("Veuillez vous connecter pour ajouter des articles au panier");
      router.push("/login");
      return;
    }
    
    addItem({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      categoryId: dish.categoryId,
      image: dish.image
    });
  }, [addItem, session, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-sm sm:text-base">Une erreur est survenue lors du chargement du menu.</p>
          <button onClick={() => window.location.reload()} className="text-sm sm:text-base">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const menuByCategory = menuItems?.data?.items.reduce((acc, dish) => {
    const category = dish.category?.name || 'Autres';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(dish);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="min-h-screen bg-[#f9f5f0]">
      <StructuredData type="menu" />
      <MenuHero />

      <section id="menu-content" className="py-8 sm:py-12 lg:py-16 xl:py-20 bg-[#f9f5f0]">
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <MenuHeader />
          
          <MenuFilters
            searchTerm={localSearchTerm}
            onSearchChange={handleSearchChange}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categoryOptions={availableCategories}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            sortOrder={sortOrder}
            onSortOrderChange={handleSortOrderChange}
          />

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 xl:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-orange-50 rounded-full -translate-y-16 sm:-translate-y-24 lg:-translate-y-32 translate-x-16 sm:translate-x-24 lg:translate-x-32 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-orange-50 rounded-full translate-y-16 sm:translate-y-24 lg:translate-y-32 -translate-x-16 sm:-translate-x-24 lg:-translate-x-32 opacity-50"></div>

            {menuByCategory && Object.keys(menuByCategory).length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="mb-3 sm:mb-4">
                  <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  Aucun plat trouvé
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
                  {debouncedSearchTerm ? (
                    <>Aucun plat ne correspond à votre recherche &ldquo;{debouncedSearchTerm}&rdquo;</>
                  ) : (
                    "Aucun plat disponible dans cette catégorie"
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                  {debouncedSearchTerm && (
                    <button
                      onClick={() => setLocalSearchTerm('')}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                    >
                      Effacer la recherche
                    </button>
                  )}
                  {selectedCategory !== 'Tous' && (
                    <button
                      onClick={() => setSelectedCategory('Tous')}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                    >
                      Voir tous les plats
                    </button>
                  )}
                </div>
              </div>
            )}

            {menuByCategory && Object.keys(menuByCategory).length > 0 && (
              <div className="space-y-8 sm:space-y-12">
                {Object.entries(menuByCategory).map(([categoryName, dishes]) => (
                  <MenuCategory
                    key={categoryName}
                    category={categoryName}
                    dishes={dishes}
                    onOrder={handleAddToCart}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}