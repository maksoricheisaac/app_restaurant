import { CartDrawer } from "@/components/cart/cart-drawer";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ScrollRefresh } from "@/components/motion/scroll-refresh";

// CartProvider is already supplied by the root layout — no need to nest another instance here.
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ScrollRefresh />
      <Header />
      <main className="flex-1 pt-16 sm:pt-[72px]">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
