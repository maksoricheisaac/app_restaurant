import { StockMovementType } from "@/generated/prisma";

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  minStock?: number | null;
  supplier?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  ingredientId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  ingredient: Ingredient;
  menuItem: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  type: StockMovementType;
  quantity: number;
  description?: string | null;
  userId?: string | null;
  orderId?: string | null;
  createdAt: Date;
  ingredient: Ingredient;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  order?: {
    id: string;
    user: {
      id: string;
      name: string;
    };
  } | null;
}

export interface InventoryDashboard {
  totalIngredients: number;
  lowStockIngredients: Ingredient[];
  recentMovements: StockMovement[];
  totalStockValue: number;
  lowStockCount: number;
}

export interface IngredientFormData {
  name: string;
  unit: string;
  price: number;
  stock: number;
  minStock?: number | null;
  supplier?: string | null;
  isActive: boolean;
}

export interface RecipeFormData {
  menuItemId: string;
  ingredientId: string;
  quantity: number;
}

export interface StockMovementFormData {
  ingredientId: string;
  type: StockMovementType;
  quantity: number;
  description?: string;
}

export interface InventoryFilters {
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: 'name' | 'stock' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

export interface StockMovementFilters {
  search?: string;
  page?: number;
  perPage?: number;
  type?: StockMovementType;
  ingredientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LowStockAlert {
  ingredient: Ingredient;
  currentStock: number;
  minStock: number;
  difference: number;
  percentage: number;
}
