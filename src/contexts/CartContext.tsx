"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback
} from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { createOrder } from "@/actions/public/order-actions";
import { showToastOnce } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

// Types pour le panier
export interface CartItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  categoryId: string;
  image?: string | null;
}

type OrderType = "dine_in" | "takeaway" | "delivery";
export type OrderStatus = "pending" | "cancelled";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalPriceWithDelivery: (deliveryFee?: number) => number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  tableId: string | null;
  tableNumber: number | null;
  setTableInfo: (id: string | null, number: number | null) => void;
  createOrder: (
    orderType: OrderType,
    deliveryZoneId?: string,
    deliveryAddress?: string,
    contactPhone?: string,
    specialNotes?: string
  ) => Promise<string>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [tableId, setTableId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load cart and tableId from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    const savedCart = localStorage.getItem("restaurant_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }

    const savedTableId = localStorage.getItem("restaurant_table_id");
    if (savedTableId) {
      setTableId(savedTableId);
    }

    const savedTableNumber = localStorage.getItem("restaurant_table_number");
    if (savedTableNumber) {
      setTableNumber(parseInt(savedTableNumber, 10));
    }
  }, [isClient]);

  // Save cart and tableId to localStorage whenever they change
  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem("restaurant_cart", JSON.stringify(items));
  }, [items, isClient]);

  useEffect(() => {
    if (!isClient) return;

    if (tableId) {
      localStorage.setItem("restaurant_table_id", tableId);
    } else {
      localStorage.removeItem("restaurant_table_id");
    }

    if (tableNumber) {
      localStorage.setItem("restaurant_table_number", tableNumber.toString());
    } else {
      localStorage.removeItem("restaurant_table_number");
    }
  }, [tableId, tableNumber, isClient]);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === newItem.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...newItem, quantity: 1 }];
      }
    });
    
    showToastOnce("success", "Article ajouté au panier");
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    showToastOnce("error", "Article retiré du panier");
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      showToastOnce("error", "Article retiré du panier");
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const setTableInfo = useCallback((id: string | null, number: number | null) => {
    setTableId(id);
    setTableNumber(number);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setTableId(null);
    setTableNumber(null);
    localStorage.removeItem("restaurant_table_id");
    localStorage.removeItem("restaurant_table_number");
    showToastOnce("success", "Panier vidé");
  }, []);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [items]);

  const getTotalPriceWithDelivery = useCallback((deliveryFee: number = 0) => {
    return getTotalPrice() + deliveryFee;
  }, [getTotalPrice]);

  // Mutation createOrder avec TanStack Query
  const { mutateAsync: createOrderMutation } = useMutation({
    mutationFn: async ({
      orderType,
      deliveryZoneId,
      deliveryAddress,
      contactPhone,
      specialNotes
    }: {
      orderType: OrderType;
      deliveryZoneId?: string;
      deliveryAddress?: string;
      contactPhone?: string;
      specialNotes?: string;
    }) => {
      // Vérifier que l'utilisateur est connecté
      if (!session?.user) {
        throw new Error("Vous devez être connecté pour passer une commande");
      }

      
      const result = await createOrder({
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        orderType: orderType,
        tableId: tableId ?? undefined,
        userId: session.user.id,
        // Champs livraison
        deliveryZoneId,
        deliveryAddress,
        contactPhone,
        // Notes spéciales
        specialNotes
      });

      // Log complet pour debug
      console.log("Résultat complet de createOrder:", result);

      // Gestion d'erreur améliorée : on regarde aussi result.error
      if (result.validationErrors || result.serverError) {
        let errorMessage = "Erreur lors de la création de la commande";
        if (typeof result.validationErrors === "string") {
          errorMessage = result.validationErrors;
        } else if (typeof result.serverError === "string") {
          errorMessage = result.serverError;
        }
        throw new Error(errorMessage);
      }

      // Vérifier si l'action a échoué (success: false)
      if (result.data && 'success' in result.data && !result.data.success) {
        const errorMessage = result.data.error || "Erreur lors de la création de la commande";
        throw new Error(errorMessage);
      }

      // Vérifier que l'orderId existe
      if (!result.data?.data?.orderId) {
        console.log("Structure de result.data:", result.data);
        throw new Error("Erreur lors de la création de la commande. Veuillez réessayer.");
      }

      return result.data.data.orderId;
    },
    onSuccess: (orderId: string) => {
      // Laisser l'UI d'appel (CheckoutForm) afficher l'écran de succès
      // et décider quand fermer/vider le panier.
      toast.success(`Commande ${orderId} créée avec succès !`);
      // queryClient.invalidateQueries({ queryKey: ['orders'] }); // si tu veux revalider une liste
    },
    onError: (error: Error) => {
      console.error("Erreur détaillée:", error);
      
      if (error.message === "Vous devez être connecté pour passer une commande") {
        toast.error("Veuillez vous connecter pour passer une commande");
        router.push("/login");
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Erreur lors de la création de la commande");
      }
    }
  });

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getTotalPriceWithDelivery,
        isOpen,
        setIsOpen,
        tableId,
        tableNumber,
        setTableInfo,
        createOrder: (
          orderType: OrderType,
          deliveryZoneId?: string,
          deliveryAddress?: string,
          contactPhone?: string,
          specialNotes?: string
        ) =>
          createOrderMutation({
            orderType,
            deliveryZoneId,
            deliveryAddress,
            contactPhone,
            specialNotes
          })
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
