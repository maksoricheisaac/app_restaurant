import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Search } from 'lucide-react';
import React from 'react';

interface OrderSearchFormProps {
  orderId: string;
  setOrderId: (id: string) => void;
  loading: boolean;
  error: string;
  onSearch: () => void;
}

export const OrderSearchForm: React.FC<OrderSearchFormProps> = ({ orderId, setOrderId, loading, error, onSearch }) => (
  <Card className="shadow-lg border-0 mb-4 sm:mb-6 lg:mb-8 overflow-hidden">
    <CardHeader className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-orange-50 to-orange-100">
      <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
        <Search className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 sm:mr-3 text-orange-600" />
        Rechercher une commande
      </CardTitle>
      <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2 md:mt-3">
        Entrez votre numéro de commande pour suivre son état en temps réel
      </p>
    </CardHeader>
    <CardContent className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          <Label htmlFor="orderId" className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2 md:mb-3 block">
            Numéro de commande
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            <Input
              id="orderId"
              type="text"
              placeholder="Ex: CMD-1234567890"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
              className="pl-9 sm:pl-10 md:pl-12 h-10 sm:h-11 md:h-12 lg:h-14 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg transition-all duration-200"
            />
          </div>
        </div>
        <div className="flex items-end">
          <Button
            onClick={onSearch}
            disabled={loading || !orderId.trim()}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-500 h-10 sm:h-11 md:h-12 lg:h-14 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl font-medium sm:font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-2" />
            )}
            <span className="hidden sm:inline">Rechercher</span>
            <span className="sm:hidden">OK</span>
          </Button>
        </div>
      </div>
      {error && (
        <div className="mt-3 sm:mt-4 md:mt-5 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl">
          <p className="text-red-600 text-xs sm:text-sm md:text-base flex items-start">
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);
