import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, MapPin, Phone, Mail, CheckCircle, Package, Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { toast } from 'sonner';

const statusSteps: Record<OrderStatus, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  'pending': { label: 'En attente', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  'preparing': { label: 'En préparation', icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'ready': { label: 'Prête', icon: Bell, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  'served': { label: 'Servie', icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'cancelled': { label: 'Annulée', icon: Clock, color: 'text-red-600', bgColor: 'bg-red-100' }
};

function getStatusProgress(status: OrderStatus) {
  const steps = ['pending', 'preparing', 'ready', 'served'] as const;
  const currentIndex = steps.indexOf(status as typeof steps[number]);
  return currentIndex >= 0 ? currentIndex : 0;
}

interface OrderStatusCardProps {
  order: Order;
  onRefresh: () => void;
}

export const OrderStatusCard: React.FC<OrderStatusCardProps> = ({ order, onRefresh }) => {
  const [createdAt, setCreatedAt] = React.useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<OrderStatus | null>(null);

  React.useEffect(() => {
    setCreatedAt(
      new Date(order.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
    // Removed remaining time calculation as it's not being used
  }, [order.createdAt, order.type]);

  // Détecter quand une commande passe de "pending" à "preparing" (validation)
  useEffect(() => {
    if (previousStatus === "pending" && order.status === "preparing") {
      setShowConfirmation(true);
      // Notification toast
      toast.success("🎉 Votre commande a été validée !", {
        description: "Elle est maintenant en préparation. Vous recevrez une notification quand elle sera prête.",
        duration: 5000,
      });
      // Masquer la confirmation après 8 secondes
      const timer = setTimeout(() => {
        setShowConfirmation(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
    setPreviousStatus(order.status);
  }, [order.status, previousStatus]);

  if (order.status === 'cancelled') {
    // Affichage spécial pour commande annulée
    return (
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardHeader className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-red-100 to-red-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-700 break-words">
                Commande {order.id}
              </CardTitle>
              <p className="text-xs sm:text-sm md:text-base text-red-600 mt-1 sm:mt-2">
                Passée le {createdAt}
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <Badge 
                className={`${statusSteps.cancelled.bgColor} ${statusSteps.cancelled.color} text-[10px] sm:text-xs md:text-sm font-semibold px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full whitespace-nowrap`}
              >
                {statusSteps.cancelled.label}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="hover:bg-red-50 hover:border-red-300 transition-colors p-1.5 sm:p-2"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-red-600" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center">
            <Clock className="h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-700 mb-2">Commande annulée</h2>
            <p className="text-sm sm:text-base md:text-lg text-red-600 mb-4 text-center">Cette commande a été annulée. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter le restaurant.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Affichage de confirmation quand la commande est validée
  if (showConfirmation) {
    return (
      <Card className="shadow-lg border-2 border-green-200 bg-green-50/50 overflow-hidden animate-in slide-in-from-top-2 duration-500">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-green-800 mb-2 sm:mb-3">
                🎉 Commande #{order.id.slice(-6).toUpperCase()} validée !
              </h3>
              <p className="text-green-700 mb-4 sm:mb-6 text-sm sm:text-base">
                Votre commande a été confirmée et est maintenant en préparation.
              </p>
              <div className="bg-white rounded-lg p-4 sm:p-6 border border-green-200 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-green-600 mb-3 sm:mb-4">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">Suivez l&apos;état de votre commande</span>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm sm:text-base text-gray-600">✅ Commande confirmée</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-sm sm:text-base text-gray-600 font-medium">🔄 En préparation (actuel)</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-sm sm:text-base text-gray-600">📦 Prête à récupérer</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
              >
                Fermer
              </Button>
              <Button
                size="sm"
                onClick={onRefresh}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Affichage normal (progress bar sans annulé)
  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardHeader className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
              Commande {order.id}
            </CardTitle>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">
              Passée le {createdAt}
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <Badge 
              className={`${statusSteps[order.status].bgColor} ${statusSteps[order.status].color} text-[10px] sm:text-xs md:text-sm font-semibold px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full whitespace-nowrap`}
            >
              {statusSteps[order.status].label}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="hover:bg-orange-50 hover:border-orange-300 transition-colors p-1.5 sm:p-2"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 overflow-x-auto sm:overflow-visible scrollbar-hide">
            {(['pending', 'preparing', 'ready', 'served'] as OrderStatus[]).map((status, index) => {
              const config = statusSteps[status];
              const isActive = getStatusProgress(order.status) >= index;
              const isCurrent = getStatusProgress(order.status) === index;
              const Icon = config.icon;
              return (
                <div key={status} className="flex flex-col items-center flex-shrink-0 sm:flex-1 px-1 sm:px-2 md:px-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center mb-1.5 sm:mb-2 md:mb-3 transition-all duration-300 ${
                    isActive 
                      ? `${config.bgColor} ${config.color} scale-110` 
                      : 'bg-gray-100 text-gray-400'
                  } ${isCurrent ? 'ring-2 sm:ring-4 ring-orange-200' : ''}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" />
                  </div>
                  <span className={`text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-center whitespace-nowrap ${
                    isActive ? config.color : 'text-gray-400'
                  }`}>
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="relative mt-2 sm:mt-3 md:mt-4">
            <div className="absolute top-0 left-0 h-1 sm:h-1.5 md:h-2 bg-gray-200 rounded-full w-full"></div>
            <div 
              className="absolute top-0 left-0 h-1 sm:h-1.5 md:h-2 bg-gradient-to-r from-orange-600 to-orange-700 rounded-full transition-all duration-500"
              style={{ width: `${(getStatusProgress(order.status) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Order Type Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-gray-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4 flex items-center text-sm sm:text-base md:text-lg lg:text-xl">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-2 text-orange-600 flex-shrink-0" />
              Type de commande
            </h4>
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700">
                {order.type === 'dine_in' && 'Sur place (au restaurant)'}
                {order.type === 'takeaway' && 'À emporter'}
                {order.type === 'delivery' && 'Livraison à domicile'}
              </p>
              {order.table?.number && (
                <p className="text-xs sm:text-sm md:text-base text-gray-600">
                  Table: {order.table.number}
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4 flex items-center text-sm sm:text-base md:text-lg lg:text-xl">
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-2 text-orange-600 flex-shrink-0" />
              Informations client
            </h4>
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 break-words">
                {order.user.name || 'Client'}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 flex items-center">
                <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                <span className="break-all">{order.user.phone}</span>
              </p>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 flex items-center">
                <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                <span className="break-all">{order.user.email}</span>
              </p>
              {order.user.name && (
                <p className="text-xs sm:text-sm md:text-base text-gray-600 flex items-start">
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 mt-0.5 text-gray-500 flex-shrink-0" />
                  <span className="break-words">Commande pour: {order.user.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
