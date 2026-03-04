import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, LayoutGrid, UtensilsCrossed, ArrowLeft, Save, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Category, MenuItem } from "../types";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "items">("categories");

  // Form states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Utensils");

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: 0,
    category_id: 0,
    image_url: "https://picsum.photos/seed/food/400/300"
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`/get-menu-now?t=${Date.now()}`);
      const data = await res.json();
      setCategories(data.categories);
      setItems(data.items);
      if (data.categories.length > 0 && newItem.category_id === 0) {
        setNewItem(prev => ({ ...prev, category_id: data.categories[0].id }));
      }
    } catch (error) {
      toast.error("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCatName) return;
    try {
      const res = await fetch("/admin-api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, icon: newCatIcon })
      });
      if (res.ok) {
        toast.success("Category added");
        setNewCatName("");
        setShowAddCategory(false);
        fetchMenu();
      }
    } catch (error) {
      toast.error("Error adding category");
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Are you sure? This will delete all items in this category.")) return;
    try {
      const res = await fetch(`/admin-api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted");
        fetchMenu();
      }
    } catch (error) {
      toast.error("Error deleting category");
    }
  };

  const addItem = async () => {
    if (!newItem.name || !newItem.price) return;
    try {
      const res = await fetch("/admin-api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        toast.success("Item added");
        setNewItem({ ...newItem, name: "", description: "", price: 0 });
        setShowAddItem(false);
        fetchMenu();
      }
    } catch (error) {
      toast.error("Error adding item");
    }
  };

  const deleteItem = async (id: number) => {
    try {
      const res = await fetch(`/admin-api/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Item deleted");
        fetchMenu();
      }
    } catch (error) {
      toast.error("Error deleting item");
    }
  };

  if (loading) return <div className="p-8 text-center font-serif italic">Loading dashboard...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-stone-50">
      <div className="flex justify-between items-center mb-12">
        <Link to="/" className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Menu</span>
        </Link>
        <h1 className="text-3xl font-serif">Management</h1>
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "categories" ? "bg-stone-900 text-white shadow-lg" : "bg-white text-stone-400 border border-stone-200"
          }`}
        >
          <LayoutGrid size={20} />
          <span className="font-bold uppercase tracking-widest text-xs">Categories</span>
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "items" ? "bg-stone-900 text-white shadow-lg" : "bg-white text-stone-400 border border-stone-200"
          }`}
        >
          <UtensilsCrossed size={20} />
          <span className="font-bold uppercase tracking-widest text-xs">Menu Items</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "categories" ? (
          <motion.div
            key="cats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-xl">Categories ({categories.length})</h2>
              <button
                onClick={() => setShowAddCategory(true)}
                className="bg-stone-900 text-white p-2 rounded-full hover:scale-110 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>

            {showAddCategory && (
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm mb-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold uppercase tracking-widest text-xs">New Category</h3>
                  <button onClick={() => setShowAddCategory(false)}><X size={16} /></button>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Category Name (e.g. Appetizers)"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <select
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                  >
                    <option value="Utensils">Utensils</option>
                    <option value="Soup">Soup</option>
                    <option value="IceCream">IceCream</option>
                    <option value="Coffee">Coffee</option>
                  </select>
                  <button
                    onClick={addCategory}
                    className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Save Category
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex justify-between items-center group">
                  <span className="font-medium">{cat.name}</span>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-stone-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="items"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-xl">Menu Items ({items.length})</h2>
              <button
                onClick={() => setShowAddItem(true)}
                className="bg-stone-900 text-white p-2 rounded-full hover:scale-110 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>

            {showAddItem && (
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm mb-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold uppercase tracking-widest text-xs">New Menu Item</h3>
                  <button onClick={() => setShowAddItem(false)}><X size={16} /></button>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Item Name"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                  <textarea
                    placeholder="Description"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900 h-24"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Price"
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                      value={newItem.price || ""}
                      onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                    />
                    <select
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                      value={newItem.category_id}
                      onChange={(e) => setNewItem({ ...newItem, category_id: parseInt(e.target.value) })}
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Image URL"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
                    value={newItem.image_url}
                    onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  />
                  <button
                    onClick={addItem}
                    className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Save Item
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center gap-4 group">
                  <img src={item.image_url} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-grow">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-[10px] text-stone-400 uppercase tracking-widest">
                      {categories.find(c => c.id === item.category_id)?.name} • ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-stone-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
