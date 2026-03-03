import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Package,
  LogOut
} from "lucide-react";
import { Order, Category, MenuItem } from "../types";
import toast from "react-hot-toast";

let socket: Socket;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings' | 'qr'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  
  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'Utensils' });
  const [newItem, setNewItem] = useState({ 
    category_id: 0, 
    name: '', 
    description: '', 
    price: 0, 
    image_url: 'https://picsum.photos/seed/food/400/300' 
  });

  useEffect(() => {
    fetchData();
    
    socket = io();
    socket.on("new_order", (order: Order) => {
      setOrders(prev => [order, ...prev]);
      toast.success(`New order from ${order.location_id}!`, {
        icon: '🔔',
        duration: 5000
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchData = async () => {
    const [menuRes, ordersRes] = await Promise.all([
      fetch("/api/menu"),
      fetch("/api/orders")
    ]);
    const menuData = await menuRes.json();
    const ordersData = await ordersRes.json();
    
    setCategories(menuData.categories);
    setItems(menuData.items);
    setOrders(ordersData);
    if (menuData.categories.length > 0) {
      setNewItem(prev => ({ ...prev, category_id: menuData.categories[0].id }));
    }
  };

  const updateOrderStatus = async (id: number, status: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        toast.success(`Order #${id} updated to ${status}`);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCategory)
    });
    if (res.ok) {
      toast.success("Category added");
      setNewCategory({ name: '', icon: 'Utensils' });
      fetchData();
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.category_id) return;
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem)
    });
    if (res.ok) {
      toast.success("Item added");
      setNewItem(prev => ({ ...prev, name: '', description: '', price: 0 }));
      fetchData();
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Item deleted");
      fetchData();
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("This will delete all items in this category. Continue?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Category deleted");
      fetchData();
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f0]">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-white p-8 flex flex-col">
        <div className="mb-12">
          <h1 className="text-2xl font-serif italic">Grand Admin</h1>
          <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">Management Suite</p>
        </div>

        <nav className="flex-grow space-y-2">
          <SidebarLink 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')}
            icon={<ClipboardList size={20} />}
            label="Live Orders"
            badge={orders.filter(o => o.status === 'pending').length}
          />
          <SidebarLink 
            active={activeTab === 'menu'} 
            onClick={() => setActiveTab('menu')}
            icon={<LayoutDashboard size={20} />}
            label="Menu Editor"
          />
          <SidebarLink 
            active={activeTab === 'qr'} 
            onClick={() => setActiveTab('qr')}
            icon={<Plus size={20} className="rotate-45" />}
            label="QR Links"
          />
          <SidebarLink 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings size={20} />}
            label="Settings"
          />
        </nav>

        <button className="flex items-center gap-3 text-stone-500 hover:text-white transition-colors text-sm mt-auto">
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto p-12">
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-serif">Live Orders</h2>
                  <p className="text-stone-400 text-sm mt-1">Real-time incoming requests from guests</p>
                </div>
                <div className="flex gap-4">
                  <StatCard label="Pending" value={orders.filter(o => o.status === 'pending').length} color="text-amber-600" />
                  <StatCard label="Completed" value={orders.filter(o => o.status === 'delivered').length} color="text-green-600" />
                </div>
              </header>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Order #{order.id}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <h3 className="text-2xl font-serif">{order.location_id}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-mono font-medium">${order.total.toFixed(2)}</p>
                        <p className="text-[10px] text-stone-400 uppercase tracking-tighter mt-1">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex-grow space-y-3 mb-8">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-stone-600">
                            <span className="font-mono font-bold mr-2">{item.quantity}x</span>
                            {item.name}
                          </span>
                          <span className="text-stone-400">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-stone-50">
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="flex-grow bg-stone-900 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all"
                        >
                          Accept Order
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="flex-grow bg-green-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-all"
                        >
                          Mark Delivered
                        </button>
                      )}
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="px-4 py-3 border border-stone-200 text-stone-400 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header>
                <h2 className="text-4xl font-serif">Menu Editor</h2>
                <p className="text-stone-400 text-sm mt-1">Manage your categories and culinary offerings</p>
              </header>

              {/* Categories Management */}
              <section className="space-y-6">
                <div className="flex justify-between items-end">
                  <h3 className="text-xl font-serif italic">Categories</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-white p-6 rounded-2xl border border-stone-100 flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                          <Package size={18} />
                        </div>
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <button 
                        onClick={() => deleteCategory(cat.id)}
                        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <form onSubmit={addCategory} className="bg-stone-200/50 p-6 rounded-2xl border border-dashed border-stone-300 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="New Category..."
                      value={newCategory.name}
                      onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="bg-transparent border-none focus:ring-0 text-sm flex-grow"
                    />
                    <button type="submit" className="text-stone-500 hover:text-stone-900">
                      <Plus size={20} />
                    </button>
                  </form>
                </div>
              </section>

              {/* Items Management */}
              <section className="space-y-6">
                <h3 className="text-xl font-serif italic">Menu Items</h3>
                <div className="bg-white rounded-[32px] border border-stone-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50 text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                        <th className="px-8 py-4">Item</th>
                        <th className="px-8 py-4">Category</th>
                        <th className="px-8 py-4">Price</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {items.map(item => (
                        <tr key={item.id} className="group hover:bg-stone-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-4">
                              <img src={item.image_url} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-stone-400 line-clamp-1">{item.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-sm text-stone-500">
                            {categories.find(c => c.id === item.category_id)?.name}
                          </td>
                          <td className="px-8 py-4 font-mono text-sm">${item.price.toFixed(2)}</td>
                          <td className="px-8 py-4 text-right">
                            <button 
                              onClick={() => deleteItem(item.id)}
                              className="text-stone-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Add Item Row */}
                      <tr className="bg-stone-50/30">
                        <td className="px-8 py-6" colSpan={4}>
                          <form onSubmit={addItem} className="flex gap-4 items-center">
                            <input 
                              type="text" 
                              placeholder="Item Name"
                              value={newItem.name}
                              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                              className="bg-white border-stone-200 rounded-lg text-sm px-4 py-2 flex-grow"
                            />
                            <select 
                              value={newItem.category_id}
                              onChange={e => setNewItem({ ...newItem, category_id: parseInt(e.target.value) })}
                              className="bg-white border-stone-200 rounded-lg text-sm px-4 py-2"
                            >
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="Price"
                              value={newItem.price || ''}
                              onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                              className="bg-white border-stone-200 rounded-lg text-sm px-4 py-2 w-24"
                            />
                            <button type="submit" className="bg-stone-900 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-stone-800">
                              Add Item
                            </button>
                          </form>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'qr' && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-4xl font-serif">QR Code Links</h2>
                <p className="text-stone-400 text-sm mt-1">Copy these URLs to generate QR codes for your tables and rooms</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
                  <h3 className="text-xl font-serif mb-4 italic">Restaurant Tables</h3>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <div key={num} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <span className="font-medium">Table {num}</span>
                        <button 
                          onClick={() => {
                            const url = `${window.location.origin}/menu?table=${num}`;
                            navigator.clipboard.writeText(url);
                            toast.success(`URL for Table ${num} copied!`);
                          }}
                          className="text-[10px] font-bold uppercase tracking-widest text-stone-900 hover:underline bg-white px-3 py-1 rounded-full border border-stone-200"
                        >
                          Copy URL
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
                  <h3 className="text-xl font-serif mb-4 italic">Hotel Rooms</h3>
                  <div className="space-y-4">
                    {['101', '102', '103', '201', '202', '203', '301', '302'].map(num => (
                      <div key={num} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <span className="font-medium">Room {num}</span>
                        <button 
                          onClick={() => {
                            const url = `${window.location.origin}/menu?room=${num}`;
                            navigator.clipboard.writeText(url);
                            toast.success(`URL for Room ${num} copied!`);
                          }}
                          className="text-[10px] font-bold uppercase tracking-widest text-stone-900 hover:underline bg-white px-3 py-1 rounded-full border border-stone-200"
                        >
                          Copy URL
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-4xl font-serif">Settings</h2>
                <p className="text-stone-400 text-sm mt-1">Configure your establishment details</p>
              </header>
              <div className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
                <p className="text-stone-500 italic">General settings coming soon...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarLink({ active, onClick, icon, label, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
        active ? "bg-white/10 text-white" : "text-stone-500 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-amber-500 text-stone-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <div className="bg-white px-6 py-3 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{label}</span>
      <span className={`text-2xl font-serif ${color}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const styles = {
    pending: "bg-amber-100 text-amber-700",
    preparing: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700"
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}
