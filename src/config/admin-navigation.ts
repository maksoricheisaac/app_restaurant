import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  MapPin,
  Package,
  Folder,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  CreditCard,
  Warehouse,
} from "lucide-react";

export const adminNav = [
  { name: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Commandes", href: "/admin/orders", icon: ShoppingCart },
  { name: "Caisse", href: "/admin/cash-register", icon: CreditCard },
  { name: "Clients", href: "/admin/customers", icon: Users },
  { name: "Tables & QR", href: "/admin/tables", icon: MapPin },
  { name: "Menu", href: "/admin/menu", icon: Package },
  { name: "Inventaire", href: "/admin/inventory", icon: Warehouse },
  { name: "Catégories", href: "/admin/categories", icon: Folder },
  { name: "Réservations", href: "/admin/reservations", icon: Calendar },
  { name: "Rapports", href: "/admin/reports", icon: BarChart3 },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Paramètres", href: "/admin/settings", icon: Settings },
]; 