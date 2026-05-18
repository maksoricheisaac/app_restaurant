"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
}
interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}
interface CartItem extends MenuItem {
  quantity: number;
}

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1")
    : "";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
  }).format(price);

export default function OrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const tableId = searchParams.get("table");

  const [restaurant, setRestaurant] = useState<{ name: string; logo: string | null } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1"}/public-menu/${slug}`,
        );
        if (!res.ok) { notFound(); return; }
        const data = await res.json();
        setRestaurant(data.tenant);
        setCategories(data.menu);
        if (data.menu.length > 0) setActiveCategory(data.menu[0].id);
      } catch {
        toast.error("Impossible de charger le menu");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMenu();
  }, [slug]);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} ajouté`);
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => c.id === id ? { ...c, quantity: c.quantity + delta } : c)
        .filter((c) => c.quantity > 0),
    );
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  async function submitOrder() {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1"}/public-menu/${slug}/order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: tableId ? "dine_in" : "takeaway",
            tableId: tableId || undefined,
            items: cart.map((c) => ({
              menuItemId: c.id,
              name: c.name,
              quantity: c.quantity,
              price: c.price,
              image: c.image,
            })),
          }),
        },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrderDone(data.orderId);
      setCart([]);
    } catch {
      toast.error("Erreur lors de l'envoi de la commande");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (orderDone) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Commande envoyée !</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Votre commande a été transmise à la cuisine.{tableId ? ` Elle sera servie à votre table.` : ""}
        </p>
        <p className="text-xs text-slate-400 mt-4">Référence : {orderDone.slice(-8).toUpperCase()}</p>
        <Button className="mt-8" onClick={() => { setOrderDone(null); }}>
          Commander autre chose
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={`/menu/${slug}`}><ArrowLeft className="h-4 w-4" /></a>
          </Button>
          <div className="flex-1">
            <p className="text-base font-bold">{restaurant?.name}</p>
            {tableId && <p className="text-xs text-orange-600 font-medium">Table {tableId}</p>}
          </div>
          {itemCount > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold">
              <ShoppingCart className="h-3.5 w-3.5" />
              {itemCount}
            </div>
          )}
        </div>
        {/* Category tabs */}
        {categories.length > 1 && (
          <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={cn(
                  "flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                  activeCategory === cat.id
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-600 border-slate-200",
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Menu items */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-8">
        {categories.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`}>
            <h2 className="text-lg font-bold text-slate-900 mb-3">{cat.name}</h2>
            <div className="space-y-3">
              {cat.items.map((item) => {
                const cartItem = cart.find((c) => c.id === item.id);
                return (
                  <div key={item.id} className="bg-white rounded-xl p-4 flex gap-3 shadow-sm">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-18 w-18 rounded-lg object-cover flex-shrink-0" style={{ width: 72, height: 72 }} />
                    ) : (
                      <div className="h-[72px] w-[72px] rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <UtensilsCrossed className="h-6 w-6 text-orange-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-orange-600 text-sm">{formatPrice(item.price)}</span>
                        {cartItem ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.id, -1)} className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-bold w-4 text-center">{cartItem.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="h-7 w-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="h-7 w-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* Cart footer */}
      {cart.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t px-4 py-4 max-w-2xl mx-auto w-full">
          <Button
            className="w-full h-12 text-base font-bold gap-2"
            onClick={submitOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                Commander · {formatPrice(total)}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
