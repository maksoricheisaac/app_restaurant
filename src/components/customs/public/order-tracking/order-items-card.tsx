import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Order } from '@/types/order';

function formatPrice(price: number | undefined) {
  if (typeof price !== 'number') return '0 FCFA';
  return `${price.toLocaleString()} FCFA`;
}

interface ExtendedOrder extends Order {
  subtotal: number;
  tax: number;
  taxRate: number;
  deliveryFee?: number;
  tip?: number;
}

interface OrderItemsCardProps {
  order: ExtendedOrder;
}

export const OrderItemsCard: React.FC<OrderItemsCardProps> = ({ order }) => (
  <Card className="shadow-lg border-0 overflow-hidden">
    <CardHeader className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-gray-50 to-gray-100">
      <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
        <svg className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 sm:mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Détails de la commande
      </CardTitle>
    </CardHeader>
    <CardContent className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8">
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {order.orderItems.map((item) => (
          <div key={item.id} className="flex items-start gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 bg-gray-50 rounded-lg sm:rounded-xl lg:rounded-2xl hover:bg-gray-100 transition-colors border border-gray-200">
            {/* Image du plat */}
            <div className="flex-shrink-0">
              {item.image ? (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden shadow-sm">
                  <OptimizedImage
                    src={item.image}
                    alt={item.name}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                    sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-sm">
                  <div className="text-gray-400">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 md:gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl break-words">
                    {item.name}
                  </h4>
                </div>
                <div className="flex items-end justify-between sm:flex-col sm:items-end sm:justify-start gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg whitespace-nowrap">
                    {item.quantity}× {formatPrice(item.price)}
                  </p>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 whitespace-nowrap">
                    = {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        <Separator className="my-3 sm:my-4 md:my-6 lg:my-8" />
        
        <div className="flex flex-col space-y-2 sm:space-y-3 md:space-y-4">
          {/* <div className="flex justify-between items-center text-sm sm:text-base md:text-lg text-gray-600">
            <span>Sous-total</span>
            <span className="font-medium">{formatPrice(order.subtotal)}</span>
          </div>
          {order.deliveryFee && order.deliveryFee > 0 && (
            <div className="flex justify-between items-center text-sm sm:text-base md:text-lg text-gray-600">
              <span>Frais de livraison</span>
              <span className="font-medium">{formatPrice(order.deliveryFee)}</span>
            </div>
          )}
          {order.tip && order.tip > 0 && (
            <div className="flex justify-between items-center text-sm sm:text-base md:text-lg text-gray-600">
              <span>Pourboire</span>
              <span className="font-medium">{formatPrice(order.tip)}</span>
            </div>
          )}
          <Separator className="my-2 sm:my-3 md:my-4" /> */}
          <div className="flex justify-between items-center text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-orange-600 bg-orange-50 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl">
            <span>Total</span>
            <span>{formatPrice(order.total || 0)}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
