/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { History, Mail, ChevronDown, ChevronUp, Clock, MapPin, Package, Calendar } from 'lucide-react';
import { useOrderHistory } from '@/hooks/queries/useOrderHistory';
import { useEffect } from 'react';
import { OrderStatus, OrderType } from '@/types/order';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { $Enums } from '@/generated/prisma';

const statusLabels: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  'pending': { label: 'En attente', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  'preparing': { label: 'En préparation', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  'ready': { label: 'Prête', color: 'text-indigo-800', bgColor: 'bg-indigo-100' },
  'served': { label: 'Servie', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  'cancelled': { label: 'Annulée', color: 'text-red-800', bgColor: 'bg-red-100' },
};

const orderTypeLabels: Record<OrderType, { label: string; icon: React.ElementType }> = {
  'dine_in': { label: 'Sur place', icon: MapPin },
  'takeaway': { label: 'À emporter', icon: Package },
  'delivery': { label: 'Livraison', icon: Package }
};

function formatPrice(price: number) {
  return `${price.toLocaleString()} FCFA`;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface OrderHistoryProps {
  onOrderSelect: (orderId: string) => void;
  email?: string;
}

export function OrderHistory({ onOrderSelect, email }: OrderHistoryProps) {
  const [inputEmail, setInputEmail] = useState(email || '');
  const [searchEmail, setSearchEmail] = useState<string | null>(email || null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Si email (session.user.email) existe, on préremplit et lance la recherche
  useEffect(() => {
    if (email) {
      setInputEmail(email);
      setSearchEmail(email);
    }
  }, [email]);

  const { 
    data,
    isLoading,
    isError,
    error,
    isFetching
  } = useOrderHistory(searchEmail);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputEmail.trim()) {
      setSearchEmail(inputEmail.trim());
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const orders = data?.data || [];

  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardHeader className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-gray-50 to-gray-100">
        <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
          <History className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 mr-2 sm:mr-3 text-orange-600" />
          Historique des commandes
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Formulaire de recherche par email */}
        <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="email" className="text-xs sm:text-sm md:text-base font-medium text-gray-700 flex items-center">
              <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1.5" />
              Votre adresse email
            </Label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 mt-1.5 sm:mt-2">
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="flex-1 h-10 sm:h-11 md:h-12 text-sm sm:text-base md:text-lg border-2 border-gray-200 focus:border-orange-500 rounded-lg sm:rounded-xl transition-all duration-200"
                required
                disabled={!!email}
              />
              <Button
                type="submit"
                disabled={isLoading || isFetching || !!email}
                className="h-10 sm:h-11 md:h-12 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-lg sm:rounded-xl px-3 sm:px-4 md:px-6 text-sm sm:text-base md:text-lg font-medium transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed"
              >
                {(isLoading || isFetching) ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
                    <span className="hidden sm:inline">Recherche...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-2" />
                    <span className="hidden sm:inline">Rechercher</span>
                    <span className="sm:hidden">OK</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Messages d'état */}
        {isError && (
          <div className="bg-red-50 text-red-600 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl lg:rounded-2xl text-sm sm:text-base md:text-lg border border-red-200">
            <div className="flex items-start">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error instanceof Error ? error.message : "Une erreur est survenue"}
            </div>
          </div>
        )}

        {/* Liste des commandes */}
        {orders.length > 0 ? (
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            {orders.map((order) => (
              <Collapsible key={order.id}>
                <Card className="border border-gray-200 hover:border-orange-300 transition-colors duration-200 overflow-hidden">
                  <CollapsibleTrigger 
                    className="w-full cursor-pointer"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 md:gap-6">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <div className={`${statusLabels[order.status as OrderStatus]?.bgColor} ${statusLabels[order.status as OrderStatus]?.color} w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center`}>
                              <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg break-words">
                                Commande {order.id}
                              </h3>
                              <Badge className={`${statusLabels[order.status as OrderStatus]?.bgColor} ${statusLabels[order.status as OrderStatus]?.color} text-[8px] sm:text-[10px] md:text-xs px-1.5 py-0.5 whitespace-nowrap`}>
                                {statusLabels[order.status as OrderStatus]?.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm md:text-base text-gray-600">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                              <span className="break-words">{formatDate(order.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm md:text-base text-gray-600">
                              {(() => {
                                // Normaliser le type de commande pour correspondre aux clés
                                const orderType = order.type === $Enums.OrderType.dine_in ? 'dine_in' : order.type;
                                const typeInfo = orderTypeLabels[orderType as OrderType];
                                if (!typeInfo) return null;
                                
                                const TypeIcon = typeInfo.icon;
                                return (
                                  <>
                                    <TypeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                                    <span className="break-words">{typeInfo.label}</span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg">
                              {formatPrice(order.total)}
                            </p>
                            <p className="text-xs sm:text-sm md:text-base text-gray-600">
                              {order.items.length} article{order.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1.5 sm:p-2"
                            onClick={() => onOrderSelect(order.id)}
                          >
                            {expandedOrders.has(order.id) ? (
                              <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Separator />
                    <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 bg-gray-50">
                      <div className="space-y-3 sm:space-y-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 sm:gap-4">
                            {/* Image du plat */}
                            <div className="flex-shrink-0">
                              {item.image ? (
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-sm">
                                  <OptimizedImage
                                    src={item.image}
                                    alt={item.name}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                    sizes="48px"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-sm">
                                  <div className="text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 text-sm sm:text-base md:text-lg break-words">
                                {item.name}
                              </p>
                              <p className="text-xs sm:text-sm md:text-base text-gray-600">
                                {item.quantity}× {formatPrice(item.price)}
                              </p>
                            </div>
                            <p className="text-sm sm:text-base md:text-lg font-medium text-gray-900 flex-shrink-0">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg">Total</span>
                          <span className="font-semibold text-orange-600 text-sm sm:text-base md:text-lg">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        ) : searchEmail ? (
          <div className="text-center py-8 sm:py-12 md:py-16">
            <div className="max-w-sm mx-auto">
              <Package className="mx-auto h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-gray-400" />
              <h3 className="mt-4 text-base sm:text-lg md:text-xl font-medium text-gray-900">
                Aucune commande trouvée
              </h3>
              <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-600">
                Nous n'avons trouvé aucune commande associée à cet email.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 md:py-16">
            <div className="max-w-sm mx-auto">
              <History className="mx-auto h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-gray-400" />
              <h3 className="mt-4 text-base sm:text-lg md:text-xl font-medium text-gray-900">
                Consultez votre historique
              </h3>
              <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-600">
                Entrez votre adresse email pour voir vos commandes précédentes.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 