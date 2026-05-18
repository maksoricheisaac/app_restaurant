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
import { useCreatePublicOrder } from "@/hooks/api/usePublic";
import { showToastOnce } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
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

  const { mutateAsync: createOrderMutation } = useCreatePublicOrder();

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
        ) => {
          if (!user) {
            toast.error("Veuillez vous connecter pour passer une commande");
            router.push("/login");
            throw new Error("Auth required");
          }

          return createOrderMutation({
            items: items.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            orderType,
            tableId: tableId ?? undefined,
            userId: user.id,
            deliveryZoneId,
            deliveryAddress,
            contactPhone,
            specialNotes
          }).then((res: any) => res.data.orderId);
        }
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
