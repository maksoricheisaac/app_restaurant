import { LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: string | number;
  items?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface NavCollapsible extends NavItem {
  items: NavItem[];
}

export interface SidebarData {
  navGroups: NavGroup[]
}
