import { createContext, useContext, useState, useEffect } from 'react';

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  // Guest Cart State
  const [cart, setCart] = useState([]);
  
  // All Orders (from API)
  const [orders, setOrders] = useState([]);

  // Fetch orders from API on mount
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const addToCart = (item, department) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, department, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const submitOrder = async (guestInfo) => {
    if (cart.length === 0) return false;

    const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const newOrder = {
      id: `ORD-${Date.now()}`,
      roomNumber: guestInfo.roomNumber,
      guestName: guestInfo.name,
      items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
      totalAmount,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      if (res.ok) {
        await fetchOrders();
        clearCart();
        return newOrder.id;
      }
    } catch (err) {
      console.error("Error submitting order:", err);
    }
    return false;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <OrderContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
      submitOrder,
      orders,
      updateOrderStatus,
      fetchOrders
    }}>
      {children}
    </OrderContext.Provider>
  );
};
