export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: {
    id: string;
    name: string;
  };
  categoryId: string;
  image: string | null;
  available: boolean;
  createdAt: Date;
} 