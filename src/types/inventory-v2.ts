// Types pour le module Inventaire V2 simplifié

export interface InventoryProduct {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  minStock?: number | null;
  supplier?: string | null;
  category?: string | null;
  packSize?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStats {
  total: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export interface QuickStockAction {
  ingredientId: string;
  quantity: number;
  isPack?: boolean;
  description?: string;
}

export interface StockAdjustment {
  ingredientId: string;
  newStock: number;
  description?: string;
}

export interface CreateProductInput {
  name: string;
  unit: string;
  price: number;
  stock?: number;
  minStock?: number;
  supplier?: string;
  category?: string;
  packSize?: number;
}

export interface UpdateProductInput {
  id: string;
  name?: string;
  unit?: string;
  price?: number;
  minStock?: number;
  supplier?: string;
  category?: string;
  packSize?: number;
}

export type StockStatus = 'ok' | 'low' | 'out';

export interface StockStatusInfo {
  status: StockStatus;
  label: string;
  color: string;
  icon: string;
}

export interface InventoryFiltersV2 {
  search?: string;
  category?: string;
  stockStatus?: 'all' | 'low' | 'out';
}

// Event Pusher pour les mises à jour de stock
export interface StockUpdateEvent {
  ingredientId: string;
  name: string;
  newStock: number;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity?: number;
  oldStock?: number;
  difference?: number;
}

// Catégories prédéfinies
export const PRODUCT_CATEGORIES = [
  'Boisson',
  'Ingrédient',
  'Emballage',
  'Autre',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Unités prédéfinies
export const PRODUCT_UNITS = [
  'unité',
  'L',
  'kg',
  'g',
  'pack',
  'bouteille',
  'canette',
] as const;

export type ProductUnit = typeof PRODUCT_UNITS[number];
