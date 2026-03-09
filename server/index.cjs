const express = require('express');
const cors = require('cors');
const db = require('./database.cjs');

const app = express();
app.use(cors());
app.use(express.json());

// --- MENU API ---

// Get all menu items
app.get('/api/menu', (req, res) => {
  db.all("SELECT * FROM menu_items", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add new menu item
app.post('/api/menu', (req, res) => {
  const { id, department, name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image } = req.body;
  const sql = `INSERT INTO menu_items (id, department, name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, department, name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

// Update menu item
app.put('/api/menu/:id', (req, res) => {
  const { name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image } = req.body;
  const sql = `UPDATE menu_items SET name_en = ?, name_ar = ?, name_tr = ?, name_ku = ?, desc_en = ?, desc_ar = ?, desc_tr = ?, desc_ku = ?, price = ?, image = ? WHERE id = ?`;
  
  db.run(sql, [name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, updated: this.changes });
  });
});

// Delete menu item
app.delete('/api/menu/:id', (req, res) => {
  db.run("DELETE FROM menu_items WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// --- ORDERS API ---

// Get all orders
app.get('/api/orders', (req, res) => {
  db.all("SELECT * FROM orders ORDER BY timestamp DESC", [], (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Fetch items for each order
    db.all("SELECT * FROM order_items", [], (err, allOrderItems) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.all("SELECT * FROM menu_items", [], (err, menuItems) => {
         if (err) return res.status(500).json({ error: err.message });
         
         const populatedOrders = orders.map(order => {
           const itemsForOrder = allOrderItems.filter(oi => oi.order_id === order.id);
           const populatedItems = itemsForOrder.map(oi => {
             const menuItem = menuItems.find(m => m.id === oi.item_id) || { name_en: 'Unknown Item', department: 'unknown' };
             return { ...menuItem, quantity: oi.quantity };
           });
           return { ...order, items: populatedItems };
         });
         
         res.json(populatedOrders);
      });
    });
  });
});

// Create new order
app.post('/api/orders', (req, res) => {
  const { id, roomNumber, guestName, totalAmount, status, timestamp, items } = req.body;
  
  db.serialize(() => {
    db.run(`INSERT INTO orders (id, roomNumber, guestName, totalAmount, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)`, 
      [id, roomNumber, guestName, totalAmount, status, timestamp], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const stmt = db.prepare(`INSERT INTO order_items (order_id, item_id, quantity) VALUES (?, ?, ?)`);
      items.forEach(item => {
        stmt.run([id, item.id, item.quantity]);
      });
      stmt.finalize();
      
      res.json({ success: true, orderId: id });
    });
  });
});

// Update order status
app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, updated: this.changes });
  });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
