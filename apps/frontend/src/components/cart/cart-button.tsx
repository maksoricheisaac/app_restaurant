import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface CartButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function CartButton({ className, variant = 'default', size = 'default' }: CartButtonProps) {
  const { getTotalItems, setIsOpen } = useCart();
  const itemCount = getTotalItems();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setIsOpen(true)}
      className={cn(
        "relative transition-all duration-300 transform hover:scale-105 items-center justify-center",
        className
      )}
    >
      <ShoppingCart className="h-5 w-5 sm:mr-2" />
      <span className="hidden sm:inline">Panier</span>
      {itemCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-pulse"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  );
}
