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
import { Permission } from "@/types/permissions";

export const adminNav = [
  { 
    name: "Tableau de bord", 
    href: "/admin/dashboard", 
    icon: LayoutDashboard,
    permission: Permission.VIEW_DASHBOARD
  },
  { 
    name: "Commandes", 
    href: "/admin/orders", 
    icon: ShoppingCart,
    permission: Permission.VIEW_ORDERS
  },
  { 
    name: "Caisse", 
    href: "/admin/cash-register", 
    icon: CreditCard,
    permission: Permission.VIEW_CASH_REGISTER
  },
  { 
    name: "Clients", 
    href: "/admin/customers", 
    icon: Users,
    permission: Permission.VIEW_CUSTOMERS
  },
  { 
    name: "Tables & QR", 
    href: "/admin/tables", 
    icon: MapPin,
    permission: Permission.VIEW_TABLES
  },
  { 
    name: "Menu", 
    href: "/admin/menu", 
    icon: Package,
    permission: Permission.VIEW_MENU
  },
  { 
    name: "Inventaire", 
    href: "/admin/inventory", 
    icon: Warehouse,
    permission: Permission.VIEW_INVENTORY
  },
  { 
    name: "Catégories", 
    href: "/admin/categories", 
    icon: Folder,
    permission: Permission.VIEW_MENU
  },
  { 
    name: "Réservations", 
    href: "/admin/reservations", 
    icon: Calendar,
    permission: Permission.VIEW_RESERVATIONS
  },
  { 
    name: "Rapports", 
    href: "/admin/reports", 
    icon: BarChart3,
    permission: Permission.VIEW_REPORTS
  },
  { 
    name: "Messages", 
    href: "/admin/messages", 
    icon: MessageSquare,
    permission: Permission.VIEW_MESSAGES
  },
  { 
    name: "Paramètres", 
    href: "/admin/settings", 
    icon: Settings,
    permission: Permission.VIEW_SETTINGS
  },
]; 