'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';
import type { MenuItem, PublicMenuData } from '../_lib/types';
import { WARM, normalizeHex, readableOn } from '../_lib/theme';
import { useMenuCart } from '../_lib/useMenuCart';
import { getActiveOrders, type StoredOrder, type OrderStatus } from '@/lib/order-storage';
import { Reveal } from '@/components/motion/reveal';
import { Stagger } from '@/components/motion/stagger';
import { MenuHero } from './menu-hero';
import { CategoryNav } from './category-nav';
import { ItemCard } from './item-card';
import { ItemDetailSheet } from './item-detail-sheet';
import { CartBar } from './cart-bar';
import { CartDrawer } from './cart-drawer';
import { MenuFooter } from './footer';
import { InlineEmpty } from './states';
import { ItemImage } from './primitives';

const STATUS_LABEL: Record<OrderStatus, { label: string; dot: string }> = {
  pending: { label: 'Reçue', dot: 'bg-blue-400' },
  preparing: { label: 'En préparation', dot: 'bg-amber-400' },
  ready: { label: 'Prête !', dot: 'bg-green-500' },
  served: { label: 'Servie', dot: 'bg-green-400' },
  cancelled: { label: 'Annulée', dot: 'bg-red-400' },
};

/** Île cliente : tout le parcours de découverte + panier du menu. */
export function MenuExperience({
  initial,
  tableId,
  tableNumber,
}: {
  initial: PublicMenuData;
  tableId: string | null;
  tableNumber: number | null;
}) {
  const router = useRouter();
  const { restaurant, menu } = initial;
  const color = normalizeHex(restaurant.primaryColor);
  const onBrand = readableOn(color);
  const currency = restaurant.currency ?? 'XAF';

  const cart = useMenuCart();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(menu[0]?.id ?? '');
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeOrders, setActiveOrders] = useState<StoredOrder[]>([]);

  const catRefs = useRef<Record<string, HTMLElement | null>>({});
  const searchRef = useRef<HTMLDivElement>(null);

  const totalItems = useMemo(
    () => menu.reduce((n, c) => n + c.items.length, 0),
    [menu],
  );

  // Filtrage par recherche (nom + description).
  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return menu;
    return menu
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description ?? '').toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [menu, q]);

  // Scroll-spy sur les sections de catégorie (désactivé pendant une recherche).
  useEffect(() => {
    if (q) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setActiveCat(e.target.id.replace('cat-', ''));
      },
      { threshold: 0.15, rootMargin: '-96px 0px -60% 0px' },
    );
    Object.values(catRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [filtered, q]);

  // Commandes en cours (bannière de rappel).
  useEffect(() => {
    setActiveOrders(getActiveOrders());
  }, []);

  // Quantité au panier par plat (toutes combinaisons d'options confondues).
  const qtyByItem = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of cart.lines) map[l.itemId] = (map[l.itemId] ?? 0) + l.quantity;
    return map;
  }, [cart.lines]);

  const selectCat = (id: string) => {
    setActiveCat(id);
    catRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openDetail = (item: MenuItem) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const quickAdd = (item: MenuItem) => {
    cart.addLine(
      {
        itemId: item.id,
        name: item.name,
        image: item.image,
        basePrice: Number(item.price),
        selectedOptions: [],
      },
      1,
    );
    toast.success(`${item.name} ajouté`, { duration: 1400 });
  };

  const goToCheckout = () => {
    router.push(`/menu/order${tableId ? `?table=${tableId}` : ''}`);
  };

  const focusSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: WARM.page, color: WARM.ink }}>
      <div ref={searchRef}>
        <MenuHero
          restaurant={restaurant}
          color={color}
          onBrand={onBrand}
          totalItems={totalItems}
          tableNumber={tableNumber}
          reservationHref={'/menu/reservation'}
          searchQuery={search}
          onSearchChange={setSearch}
          onSearchFocus={focusSearch}
        />
      </div>

      {/* Bannière commandes en cours */}
      {activeOrders.length > 0 && (
        <div className="mx-auto mt-4 w-full max-w-2xl px-4">
          <div className="rounded-2xl px-4 py-3 shadow-sm" style={{ backgroundColor: WARM.card, border: `1px solid ${WARM.border}` }}>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: WARM.faint }}>
              Mes commandes en cours
            </p>
            <div className="scrollbar-none flex gap-2 overflow-x-auto">
              {activeOrders.map((order) => {
                const cfg = STATUS_LABEL[order.status];
                return (
                  <a
                    key={order.orderId}
                    href={`/menu/track/${order.orderId}`}
                    className="group flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2 transition-colors"
                    style={{ backgroundColor: WARM.surface }}
                  >
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold leading-none" style={{ color: WARM.ink }}>#{order.ref}</span>
                      <span className="mt-0.5 block whitespace-nowrap text-xs" style={{ color: WARM.faint }}>{cfg.label}</span>
                    </span>
                    <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" style={{ color: WARM.fainter }} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <CategoryNav
        categories={filtered.map((c) => ({ id: c.id, name: c.name }))}
        active={activeCat}
        color={color}
        onBrand={onBrand}
        onSelect={selectCat}
      />

      <main className="mx-auto max-w-2xl space-y-12 px-4 pb-40 pt-8">
        {filtered.length === 0 ? (
          <InlineEmpty
            title="Aucun plat trouvé"
            subtitle={q ? `Rien ne correspond à « ${search} ».` : 'Le menu arrive bientôt.'}
          />
        ) : (
          filtered.map((category) => (
            <section
              key={category.id}
              id={`cat-${category.id}`}
              ref={(el) => { catRefs.current[category.id] = el; }}
              className="scroll-mt-24"
            >
              <Reveal className="mb-6 flex items-center gap-3" y={18}>
                <span className="h-6 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                {category.imageUrl && (
                  <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl" style={{ border: `1px solid ${WARM.border}` }}>
                    <ItemImage src={category.imageUrl} alt="" color={color} sizes="40px" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl leading-tight sm:text-[1.7rem]" style={{ color: WARM.ink }}>
                    {category.name}
                  </h2>
                  <p className="mt-0.5 text-xs" style={{ color: WARM.fainter }}>
                    {category.items.length} plat{category.items.length > 1 ? 's' : ''}
                  </p>
                </span>
              </Reveal>

              <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2" y={20}>
                {category.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    color={color}
                    onBrand={onBrand}
                    currency={currency}
                    inCartQty={qtyByItem[item.id] ?? 0}
                    onOpen={openDetail}
                    onQuickAdd={quickAdd}
                  />
                ))}
              </Stagger>
            </section>
          ))
        )}
      </main>

      <CartBar
        itemCount={cart.itemCount}
        subtotal={cart.subtotal}
        currency={currency}
        color={color}
        onBrand={onBrand}
        onOpen={() => setCartOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={cart.lines}
        subtotal={cart.subtotal}
        currency={currency}
        color={color}
        onBrand={onBrand}
        onSetQuantity={cart.setQuantity}
        onCheckout={() => {
          setCartOpen(false);
          goToCheckout();
        }}
      />

      <ItemDetailSheet
        item={detailItem}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        color={color}
        onBrand={onBrand}
        currency={currency}
        onAdd={(line, qty) => {
          cart.addLine(line, qty);
          toast.success(`${line.name} ajouté`, { duration: 1400 });
        }}
      />

      <MenuFooter restaurant={restaurant} color={color} />
    </div>
  );
}
