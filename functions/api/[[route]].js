import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

const app = new Hono().basePath('/api')

app.use('*', cors())

// --- MENU API ---

// Get all menu items
app.get('/menu', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare("SELECT * FROM menu_items").all();
  return c.json(results);
});

// Add new menu item
app.post('/menu', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { id, department, name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image } = body;
  
  const sql = `INSERT INTO menu_items (id, department, name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  try {
    await db.prepare(sql).bind(id, department, name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image).run();
    return c.json({ success: true, id });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Update menu item
app.put('/menu/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image } = body;
  
  const sql = `UPDATE menu_items SET name_en = ?, name_ar = ?, name_tr = ?, name_ku = ?, desc_en = ?, desc_ar = ?, desc_tr = ?, desc_ku = ?, price = ?, image = ? WHERE id = ?`;
  
  try {
    const result = await db.prepare(sql).bind(name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image, id).run();
    return c.json({ success: true, updated: result.meta.changes });
  } catch(err) {
    return c.json({ error: err.message }, 500);
  }
});

// Delete menu item
app.delete('/menu/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  try {
    const result = await db.prepare("DELETE FROM menu_items WHERE id = ?").bind(id).run();
    return c.json({ success: true, deleted: result.meta.changes });
  } catch(err) {
    return c.json({ error: err.message }, 500);
  }
});

// --- ORDERS API ---

// Get all orders
app.get('/orders', async (c) => {
  const db = c.env.DB;
  
  try {
    const { results: orders } = await db.prepare("SELECT * FROM orders ORDER BY timestamp DESC").all();
    const { results: allOrderItems } = await db.prepare("SELECT * FROM order_items").all();
    const { results: menuItems } = await db.prepare("SELECT * FROM menu_items").all();
    
    const populatedOrders = orders.map(order => {
      const itemsForOrder = allOrderItems.filter(oi => oi.order_id === order.id);
      const populatedItems = itemsForOrder.map(oi => {
        const menuItem = menuItems.find(m => m.id === oi.item_id) || { name_en: 'Unknown Item', department: 'unknown' };
        return { ...menuItem, quantity: oi.quantity };
      });
      return { ...order, items: populatedItems };
    });
    
    return c.json(populatedOrders);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Create new order
app.post('/orders', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { id, roomNumber, guestName, totalAmount, status, timestamp, items } = body;
  
  try {
    const stmts = [];
    stmts.push(db.prepare(`INSERT INTO orders (id, roomNumber, guestName, totalAmount, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)`).bind(id, roomNumber, guestName, totalAmount, status, timestamp));
    
    const insertItemStmt = db.prepare(`INSERT INTO order_items (order_id, item_id, quantity) VALUES (?, ?, ?)`);
    items.forEach(item => {
      stmts.push(insertItemStmt.bind(id, item.id, item.quantity));
    });
    
    await db.batch(stmts);
    
    return c.json({ success: true, orderId: id });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Update order status
app.put('/orders/:id/status', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  const { status } = body;
  
  try {
    const result = await db.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
    return c.json({ success: true, updated: result.meta.changes });
  } catch(err) {
    return c.json({ error: err.message }, 500);
  }
});

export const onRequest = handle(app);
