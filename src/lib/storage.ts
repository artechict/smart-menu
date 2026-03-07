import { Category, MenuItem } from "../types";

export interface Order {
  id: number;
  location_id: string;
  items: (MenuItem & { quantity: number })[];
  total: number;
  status: 'pending' | 'preparing' | 'delivered' | 'cancelled';
  created_at: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: "Appetizers", icon: "Soup" },
  { id: 2, name: "Main Course", icon: "Utensils" },
  { id: 3, name: "Desserts", icon: "IceCream" },
  { id: 4, name: "Drinks", icon: "Coffee" }
];

const DEFAULT_ITEMS: MenuItem[] = [
  { id: 1, category_id: 1, name: "Garlic Bread", description: "Toasted bread with garlic butter and herbs", price: 5.99, image_url: "https://picsum.photos/seed/garlic/400/300", available: true },
  { id: 2, category_id: 2, name: "Grilled Salmon", description: "Fresh salmon with asparagus and lemon butter", price: 24.50, image_url: "https://picsum.photos/seed/salmon/400/300", available: true },
  { id: 3, category_id: 3, name: "Chocolate Lava Cake", description: "Warm chocolate cake with a molten center", price: 8.99, image_url: "https://picsum.photos/seed/cake/400/300", available: true }
];

export const storage = {
  getMenu: () => {
    const categories = JSON.parse(localStorage.getItem('categories') || JSON.stringify(DEFAULT_CATEGORIES));
    const items = JSON.parse(localStorage.getItem('items') || JSON.stringify(DEFAULT_ITEMS));
    return { categories, items };
  },

  saveCategories: (categories: Category[]) => {
    localStorage.setItem('categories', JSON.stringify(categories));
  },

  saveItems: (items: MenuItem[]) => {
    localStorage.setItem('items', JSON.stringify(items));
  },

  getOrders: (): Order[] => {
    return JSON.parse(localStorage.getItem('orders') || '[]');
  },

  saveOrder: (order: Omit<Order, 'id' | 'status' | 'created_at'>) => {
    const orders = storage.getOrders();
    const newOrder: Order = {
      ...order,
      id: Date.now(),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    return newOrder;
  },

  updateOrderStatus: (id: number, status: Order['status']) => {
    const orders = storage.getOrders();
    const order = orders.find(o => o.id === id);
    if (order) {
      order.status = status;
      localStorage.setItem('orders', JSON.stringify(orders));
    }
    return order;
  }
};
