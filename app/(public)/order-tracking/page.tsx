/* eslint-disable react/no-unescaped-entities */
"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { OrderSearchForm } from '@/components/customs/public/order-tracking/order-search-form';
import { OrderStatusCard } from '@/components/customs/public/order-tracking/order-status-card';
import { OrderItemsCard } from '@/components/customs/public/order-tracking/order-items-card';
import { OrderHistory } from '@/components/customs/public/order-tracking/order-history';
import { useOrderTracking } from '@/hooks/queries/useOrderTracking';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StructuredData } from '@/components/seo/structured-data';
import { useSession } from '@/lib/auth-client';
import { pusherClient } from '@/lib/pusherClient';
import { toast } from 'sonner';

export default function OrderTrackingPage() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('id');
  const [orderId, setOrderId] = useState<string>(initialOrderId || '');
  const [activeTab, setActiveTab] = useState<string>(initialOrderId ? 'tracking' : 'history');
  const { data : session} = useSession()
  
  const { 
    data: orderData,
    isLoading,
    isError,
    error,
    refetch
  } = useOrderTracking(orderId || null);

  // Écoute des notifications en temps réel via Pusher
  useEffect(() => {
    if (!orderId) return;

    const channel = pusherClient.subscribe('restaurant-channel');
    
    // Notification de mise à jour de statut
    channel.bind('order-status-updated', (data: { order?: { id: string; status: string } }) => {
      if (data.order?.id === orderId) {
        const { status } = data.order;
        
        // Messages personnalisés selon le statut
        if (status === 'preparing') {
          toast.success("🎉 Votre commande a été validée !", {
            description: "Elle est maintenant en préparation. Vous recevrez une notification quand elle sera prête.",
            duration: 6000,
          });
        } else if (status === 'ready') {
          toast.success("📦 Votre commande est prête !", {
            description: "Vous pouvez maintenant la récupérer au restaurant.",
            duration: 6000,
          });
        } else if (status === 'completed') {
          toast.success("✅ Commande terminée !", {
            description: "Merci pour votre commande. Bon appétit !",
            duration: 5000,
          });
        } else if (status === 'cancelled') {
          toast.error("❌ Commande annulée", {
            description: "Votre commande a été annulée. Contactez le restaurant si nécessaire.",
            duration: 5000,
          });
        }
        
        // Actualiser les données
        refetch();
      }
    });

    return () => {
      channel.unbind('order-status-updated');
      pusherClient.unsubscribe('restaurant-channel');
    };
  }, [orderId, refetch]);

  const handleSearch = () => {
    if (!orderId.trim()) return;
    refetch();
    setActiveTab('tracking');
  };

  const handleOrderSelect = (selectedOrderId: string) => {
    setOrderId(selectedOrderId);
    setActiveTab('tracking');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <StructuredData type="restaurant" />
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">
            Suivi de commande
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Suivez l'état de votre commande en temps réel ou consultez votre historique
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 md:space-y-8">
          <TabsList className={`grid w-full ${session?.user ? 'grid-cols-2' : 'grid-cols-1'} max-w-xs sm:max-w-sm md:max-w-md mx-auto h-auto p-1 bg-gray-100 rounded-xl`}>
            <TabsTrigger 
              value="tracking" 
              className="text-xs sm:text-sm md:text-base font-medium py-2 sm:py-3 px-3 sm:px-4 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
            >
              Suivi de commande
            </TabsTrigger>
            {session?.user && (
              <TabsTrigger 
                value="history" 
                className="text-xs sm:text-sm md:text-base font-medium py-2 sm:py-3 px-3 sm:px-4 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
              >
                Historique
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tracking" className="space-y-4 sm:space-y-6 md:space-y-8 mt-4 sm:mt-6">
            <OrderSearchForm
              orderId={orderId}
              setOrderId={setOrderId}
              loading={isLoading}
              error={isError ? (error instanceof Error ? error.message : "Une erreur est survenue") : ""}
              onSearch={handleSearch}
            />

            {orderData?.data?.order && (
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                <OrderStatusCard
                  order={orderData.data.order}
                  onRefresh={() => refetch()}
                />
                <OrderItemsCard order={orderData.data.order} />
              </div>
            )}

            {/* État vide amélioré */}
            {!orderData?.data?.order && !isLoading && !isError && orderId && (
              <div className="text-center py-8 sm:py-12 md:py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">
                    Commande non trouvée
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    Aucune commande trouvée avec le numéro <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{orderId}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Vérifiez le numéro de commande ou consultez votre historique
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {session?.user && (
            <TabsContent value="history" className="mt-4 sm:mt-6">
              <OrderHistory email={session.user.email} onOrderSelect={handleOrderSelect}  />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}