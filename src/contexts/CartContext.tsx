"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
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
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  tableId: string | null;
  setTableId: (id: string | null) => void;
  createOrder: (
    orderType: OrderType,
    deliveryZoneId?: string,
    deliveryAddress?: string,
    contactPhone?: string
  ) => Promise<string>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [tableId, setTableId] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  // Load cart and tableId from localStorage on mount
  useEffect(() => {
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
  }, []);

  // Save cart and tableId to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("restaurant_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (tableId) {
      localStorage.setItem("restaurant_table_id", tableId);
    } else {
      localStorage.removeItem("restaurant_table_id");
    }
  }, [tableId]);

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
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
    
    // Toast unique après la mise à jour
    showToastOnce("success", "Article ajouté au panier");
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.id !== id);
      return updatedItems;
    });
    // Toast unique après la mise à jour
    showToastOnce("error", "Article retiré du panier");
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setTableId(null);
    localStorage.removeItem("restaurant_table_id");
    showToastOnce("success", "Panier vidé");
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // Mutation createOrder avec TanStack Query
  const { mutateAsync: createOrderMutation } = useMutation({
    mutationFn: async ({
      orderType,
      deliveryZoneId,
      deliveryAddress,
      contactPhone
    }: {
      orderType: OrderType;
      deliveryZoneId?: string;
      deliveryAddress?: string;
      contactPhone?: string;
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
        tableId: tableId,
        userId: session.user.id,
        // Champs livraison
        deliveryZoneId,
        deliveryAddress,
        contactPhone
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

      // Vérifier que l'orderId existe
      if (!result.data?.data?.orderId) {
        console.log("Structure de result.data:", result.data);
        throw new Error("ID de commande manquant dans la réponse");
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
        isOpen,
        setIsOpen,
        tableId,
        setTableId,
        createOrder: (
          orderType: OrderType,
          deliveryZoneId?: string,
          deliveryAddress?: string,
          contactPhone?: string
        ) =>
          createOrderMutation({
            orderType,
            deliveryZoneId,
            deliveryAddress,
            contactPhone
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
