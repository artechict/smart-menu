export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  available: number;
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: number;
  location_id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'delivered' | 'cancelled';
  created_at: string;
}
