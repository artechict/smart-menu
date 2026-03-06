import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Utensils, Coffee, IceCream, Soup, ChevronRight, X, Plus, Minus, Settings } from "lucide-react";
import { Category, MenuItem, OrderItem } from "../types";
import toast from "react-hot-toast";

const ICON_MAP: Record<string, any> = {
  Soup,
  Utensils,
  IceCream,
  Coffee,
};

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: "Appetizers", icon: "Soup" },
  { id: 2, name: "Main Course", icon: "Utensils" },
  { id: 3, name: "Desserts", icon: "IceCream" },
  { id: 4, name: "Drinks", icon: "Coffee" }
];

const FALLBACK_ITEMS: MenuItem[] = [
  { id: 1, category_id: 1, name: "Garlic Bread", description: "Toasted bread with garlic butter and herbs", price: 5.99, image_url: "https://picsum.photos/seed/garlic/400/300", available: true },
  { id: 2, category_id: 2, name: "Grilled Salmon", description: "Fresh salmon with asparagus and lemon butter", price: 24.50, image_url: "https://picsum.photos/seed/salmon/400/300", available: true },
  { id: 3, category_id: 3, name: "Chocolate Lava Cake", description: "Warm chocolate cake with a molten center", price: 8.99, image_url: "https://picsum.photos/seed/cake/400/300", available: true }
];

export default function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const roomId = searchParams.get("room");
  const locationId = tableId ? `Table ${tableId}` : roomId ? `Room ${roomId}` : "Guest";

  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [items, setItems] = useState<MenuItem[]>(FALLBACK_ITEMS);
  const [activeCategory, setActiveCategory] = useState<number | null>(FALLBACK_CATEGORIES[0].id);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await fetch("/api/menu");
        if (!res.ok) throw new Error("Failed to fetch menu");
        const data = await res.json();
        setCategories(data.categories);
        setItems(data.items);
        if (data.categories.length > 0) setActiveCategory(data.categories[0].id);
        setLoading(false);
      } catch (err: any) {
        console.error("Menu load error:", err);
        setLoading(false);
      }
    };
    loadMenu();
  }, []);

  const filteredItems = useMemo(() => {
    return activeCategory ? items.filter((i) => i.category_id === activeCategory) : items;
  }, [items, activeCategory]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: locationId,
          items: cart,
          total: cartTotal,
        }),
      });
      
      if (!res.ok) throw new Error("Order failed");
      
      toast.success("Order submitted successfully!");
      setCart([]);
      setIsCartOpen(false);
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error("Failed to submit order");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="w-8 h-8 border-4 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-stone-500 font-serif italic">Preparing your menu...</p>
    </div>
  );

  if (categories.length === 0) return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center gap-6">
      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
        <Utensils size={32} />
      </div>
      <div>
        <h2 className="text-2xl font-serif mb-2">Could not load menu</h2>
        <p className="text-stone-500 text-sm">We're having trouble connecting to our kitchen. Please try again.</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
      >
        Retry Connection
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 relative">
      {/* Header */}
      <header className="p-6 pt-12">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-4xl font-serif font-light tracking-tight">The Grand - Live</h1>
            <p className="text-sm text-stone-500 uppercase tracking-widest mt-1">Restaurant & Hotel</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-stone-200/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
              {locationId}
            </div>
            <Link to="/admin" className="p-2 bg-white border border-stone-200 rounded-full text-stone-400 hover:text-stone-900 transition-colors shadow-sm">
              <Settings size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="flex overflow-x-auto px-6 gap-4 no-scrollbar mb-8">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Utensils;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center min-w-[70px] transition-all ${
                activeCategory === cat.id ? "text-stone-900 scale-110" : "text-stone-400"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all ${
                  activeCategory === cat.id ? "bg-stone-900 text-white shadow-lg" : "bg-white border border-stone-100"
                }`}
              >
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Items List */}
      <div className="px-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {filteredItems.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-stone-100 shadow-sm">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-grow flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-lg leading-tight">{item.name}</h3>
                    <span className="font-mono text-sm font-medium">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 line-clamp-2 italic">{item.description}</p>
                  <button
                    onClick={() => addToCart(item)}
                    className="mt-2 text-[10px] font-bold uppercase tracking-widest text-stone-900 flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Add to Order <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-stone-900 text-white rounded-full shadow-2xl flex items-center justify-center z-40"
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-white">
            {cart.reduce((a, b) => a + b.quantity, 0)}
          </span>
        </motion.button>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 p-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif">Your Order</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-xs text-stone-400">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-4 bg-stone-100 rounded-full px-3 py-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-500">
                        <Minus size={14} />
                      </button>
                      <span className="font-mono text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-green-500">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 uppercase text-[10px] font-bold tracking-widest">Total Amount</span>
                  <span className="text-2xl font-serif">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={submitOrder}
                  className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors shadow-lg"
                >
                  Place Order
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
