"use client"
import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, LogIn } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { CheckoutForm } from './checkout-form';
import { Button } from '../ui/button';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function CartDrawer() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    getTotalItems,
    isOpen, 
    setIsOpen 
  } = useCart();
  
  const { data: session } = useSession();
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(price);
  };

  const handleCheckout = () => {
    if (!session?.user) {
      toast.error("Veuillez vous connecter pour passer une commande");
      router.push("/login");
      setIsOpen(false);
      return;
    }
    setShowCheckout(true);
  };

  const handleBackToCart = () => {
    setShowCheckout(false);
  };

  const handleCloseDrawer = () => {
    setShowCheckout(false);
    setIsOpen(false);
  };

  // Si on est en mode checkout, on affiche le formulaire de commande
  if (showCheckout) {
    return (
      <CheckoutForm 
        isOpen={isOpen} 
        onClose={handleCloseDrawer}
        onBack={handleBackToCart}
      />
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent 
        className="w-full sm:max-w-lg flex flex-col h-full p-0 gap-0"
        side="right"
      >
        {/* Header fixe */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-2.5 rounded-xl shadow-lg">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-gray-900">
                    Votre Panier
                  </SheetTitle>
                  <SheetDescription className="text-sm text-gray-600">
                    {getTotalItems()} article{getTotalItems() > 1 ? 's' : ''}
                  </SheetDescription>
                </div>
              </div>
              
            </div>
          </SheetHeader>
        </div>

        {/* Contenu principal avec scroll */}
        <div className="flex-1 flex flex-col min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center py-8">
                <div className="text-gray-400 mb-6">
                  <ShoppingBag className="h-20 w-20 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Votre panier est vide
                </h3>
                <p className="text-gray-600 mb-6">
                  Ajoutez des plats délicieux à votre panier pour commencer
                </p>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                >
                  Parcourir le menu
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Liste des articles */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      {/* Image du produit */}
                      <div className="flex-shrink-0">
                        {item.image ? (
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            width={60}
                            height={60}
                            className="w-15 h-15 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informations du produit */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {item.description}
                        </p>
                        <p className="text-sm font-medium text-orange-600">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      {/* Contrôles de quantité */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Bouton supprimer */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer avec total et bouton de commande */}
              <div className="flex-shrink-0 border-t border-gray-200 bg-white p-6">
                <div className="space-y-4">
                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-orange-600">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>

                  {/* Bouton de commande */}
                  {!session?.user ? (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700 text-center">
                          🔐 Connectez-vous pour passer votre commande
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          router.push("/login");
                          setIsOpen(false);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Se connecter
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 py-3 text-lg font-semibold rounded-xl"
                    >
                      Passer la commande
                    </Button>
                  )}

                  {/* Bouton vider le panier */}
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Vider le panier
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}