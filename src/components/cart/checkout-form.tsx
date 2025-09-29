 
"use client"
import { useState, useEffect } from 'react';
import { ArrowLeft, User, CheckCircle, ClipboardCheck, Clipboard, ShoppingBag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getDeliveryZones, getRestaurantSettings } from '@/actions/admin/settings-actions';
import { useQuery } from '@tanstack/react-query';
import { OrderType } from '@/types/order';

const checkoutSchema = z.object({
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']),
  tableId: z.string().optional(),
  deliveryZoneId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
})
.refine(data => {
  if (data.orderType === 'delivery' && !data.deliveryZoneId) {
    return false;
  }
  return true;
}, {
  message: "La zone de livraison est requise pour les livraisons",
  path: ['deliveryZoneId'],
}).refine(data => {
  if (data.orderType === 'delivery' && !data.deliveryAddress) {
    return false;
  }
  return true;
}, {
  message: "L'adresse de livraison est requise pour les livraisons",
  path: ['deliveryAddress'],
}).refine(data => {
  if (data.orderType === 'delivery' && !data.contactPhone) {
    return false;
  }
  return true;
}, {
  message: "Le téléphone est requis pour les livraisons",
  path: ['contactPhone'],
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}


const fetchDeliveryZones = async () => {
  const zones = await getDeliveryZones();
  return zones;
}

export function CheckoutForm({ isOpen, onClose, onBack }: CheckoutFormProps) {

  const { items, getTotalPrice, createOrder, clearCart, tableId, tableNumber } = useCart();

  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [copied, setCopied] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState(items);
  const [purchasedTotal, setPurchasedTotal] = useState(0);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      orderType: tableId ? 'dine_in' : undefined,
      notes: '',
      deliveryAddress: '',
      deliveryZoneId: '',
      contactPhone: '',
    }
  });

  const orderType = form.watch('orderType');


  const { data: deliveryZones } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: fetchDeliveryZones,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Charger les paramètres du restaurant (services activés)
  const { data: restaurantSettings } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: getRestaurantSettings,
    staleTime: 5 * 60 * 1000,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(price);
  };

  // Si un type de commande par défaut est invalide selon les paramètres, le réinitialiser
  useEffect(() => {
    if (!restaurantSettings) return;
    const current = form.getValues('orderType');
    if (current === 'dine_in' && restaurantSettings.dineInEnabled === false) {
      form.resetField('orderType');
    }
    if (current === 'takeaway' && restaurantSettings.takeawayEnabled === false) {
      form.resetField('orderType');
    }
    if (current === 'delivery' && restaurantSettings.deliveryEnabled === false) {
      form.resetField('orderType');
    }
  }, [restaurantSettings, form]);

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      const isDelivery = data.orderType === 'delivery';
      const orderId = await createOrder(
        data.orderType as OrderType,
        isDelivery ? (data.deliveryZoneId || undefined) : undefined,
        isDelivery ? (data.deliveryAddress || undefined) : undefined,
        isDelivery ? (data.contactPhone || undefined) : undefined
      );

      // Snapshot du panier avant vidage pour l'écran de succès
      setPurchasedItems([...items]);
      setPurchasedTotal(getTotalPrice());
      setOrderId(orderId);
      setOrderCreated(true);
      clearCart();
      form.reset();
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erreur lors de la création de la commande");
      }
    }
  };

  if (orderCreated) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Commande confirmée !
              </h2>
              <p className="text-gray-600">
                Votre commande a été créée avec succès
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Numéro de commande</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(orderId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="h-8 px-2 cursor-pointer"
                >
                  {copied ? (
                    <ClipboardCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clipboard className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="font-mono text-lg font-bold text-gray-900">
                #{orderId}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={() => {
                    window.open(`/order-tracking?id=${orderId}`, "_blank");
                  }}
                >
                  Suivre la commande
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Récapitulatif de la commande</h3>
              {purchasedItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {item.quantity}x
                    </span>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span>{formatPrice(purchasedTotal)}</span>
              </div>
            </div>
          </div>

          <div className="border-t p-6">
            <Button
              onClick={onClose}
              className="w-full cursor-pointer"
            >
              Fermer
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <SheetTitle className="text-xl font-bold">Finaliser la commande</SheetTitle>
              <SheetDescription>
                Choisissez vos options de commande
              </SheetDescription>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type de commande *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(!restaurantSettings || restaurantSettings.dineInEnabled) && (
                  <Button type="button" variant={orderType === 'dine_in' ? 'default' : 'outline'} onClick={() => form.setValue('orderType', 'dine_in')} className="flex flex-col h-20 cursor-pointer">
                    <User className="w-6 h-6 mb-1" />
                    <span>Sur place</span>
                  </Button>
                )}
                {(!restaurantSettings || restaurantSettings.takeawayEnabled) && (
                  <Button type="button" variant={orderType === 'takeaway' ? 'default' : 'outline'} onClick={() => form.setValue('orderType', 'takeaway')} className="flex flex-col h-20 cursor-pointer">
                    <ShoppingBag className="w-6 h-6 mb-1" />
                    <span>À emporter</span>
                  </Button>
                )}
                {(!restaurantSettings || restaurantSettings.deliveryEnabled) && (
                  <Button type="button" variant={orderType === 'delivery' ? 'default' : 'outline'} onClick={() => form.setValue('orderType', 'delivery')} className="flex flex-col h-20 cursor-pointer">
                    <Truck className="w-6 h-6 mb-1" />
                    <span>Livraison</span>
                  </Button>
                )}
              </div>
              {form.formState.errors.orderType && <p className="text-sm text-red-500">{form.formState.errors.orderType.message}</p>}
            </div>

            {orderType === 'dine_in' && tableId && (
              <div className="bg-gray-100 p-3 rounded-md border border-gray-200">
                <p className="text-sm font-medium text-gray-800">Commande pour la table : <span className="font-bold">n°{tableNumber}</span></p>
                <p className="text-xs text-gray-500">Cet identifiant a été automatiquement ajouté via le QR code.</p>
              </div>
            )}

            {orderType === 'delivery' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="deliveryZoneId">Zone de livraison *</Label>
                  <Select onValueChange={(value) => form.setValue('deliveryZoneId', value)} defaultValue={form.getValues('deliveryZoneId')}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="Sélectionnez une zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryZones?.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name} - {formatPrice(zone.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.deliveryZoneId && <p className="text-sm text-red-500">{form.formState.errors.deliveryZoneId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Adresse de livraison *</Label>
                  <Input id="deliveryAddress" {...form.register('deliveryAddress')} placeholder="Entrez votre adresse complète" />
                  {form.formState.errors.deliveryAddress && <p className="text-sm text-red-500">{form.formState.errors.deliveryAddress.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Téléphone de contact *</Label>
                  <Controller
                    name="contactPhone"
                    control={form.control}
                    render={({ field: { onChange, value } }) => (
                      <PhoneInput
                        id="contactPhone"
                        placeholder="Ex: +242 06 000 00 00"
                        defaultCountry="CG"
                        value={value ?? ""}
                        onChange={(val) => onChange((val as string) || "")}
                      />
                    )}
                  />
                  {form.formState.errors.contactPhone && <p className="text-sm text-red-500">{form.formState.errors.contactPhone.message}</p>}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes spéciales</Label>
              <Textarea id="notes" {...form.register('notes')} placeholder="Instructions spéciales, allergies, etc." />
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Récapitulatif</h3>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
            </div>

            <Button type="submit" className="w-full cursor-pointer" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Confirmation...' : 'Confirmer la commande'}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}