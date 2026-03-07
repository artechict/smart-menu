import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { JSONFilePreset } from 'lowdb/node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

// --- 1. DATABASE SETUP ---
const defaultData = {
  categories: [
    { id: 1, name: "Appetizers", icon: "Soup" },
    { id: 2, name: "Main Course", icon: "Utensils" },
    { id: 3, name: "Desserts", icon: "IceCream" },
    { id: 4, name: "Drinks", icon: "Coffee" }
  ],
  items: [
    { id: 1, category_id: 1, name: "Garlic Bread", description: "Toasted bread with garlic butter and herbs", price: 5.99, image_url: "https://picsum.photos/seed/garlic/400/300", available: true },
    { id: 2, category_id: 2, name: "Grilled Salmon", description: "Fresh salmon with asparagus and lemon butter", price: 24.50, image_url: "https://picsum.photos/seed/salmon/400/300", available: true },
    { id: 3, category_id: 3, name: "Chocolate Lava Cake", description: "Warm chocolate cake with a molten center", price: 8.99, image_url: "https://picsum.photos/seed/cake/400/300", available: true }
  ],
  orders: []
};

async function startServer() {
  const db = await JSONFilePreset(DB_PATH, defaultData);
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  
  app.use(express.json());

  // --- LOGGING MIDDLEWARE ---
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API REQUEST] ${req.method} ${req.url}`);
    }
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // --- 2. API ROUTES ---
  
  // Menu
  app.get("/api/menu", (req, res) => {
    res.json({ categories: db.data.categories, items: db.data.items });
  });

  // Orders
  app.get("/api/orders", (req, res) => {
    res.json(db.data.orders || []);
  });

  app.post("/api/orders", async (req, res) => {
    const newOrder = { 
      ...req.body, 
      id: Date.now(), 
      status: 'pending', 
      created_at: new Date().toISOString() 
    };
    if (!db.data.orders) db.data.orders = [];
    db.data.orders.push(newOrder);
    await db.write();
    io.emit("new_order", newOrder);
    res.status(201).json(newOrder);
  });

  // Admin Actions
  app.post("/api/admin/categories", async (req, res) => {
    const newCat = { ...req.body, id: Date.now() };
    db.data.categories.push(newCat);
    await db.write();
    res.status(201).json(newCat);
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    db.data.categories = db.data.categories.filter((c: any) => c.id !== id);
    db.data.items = db.data.items.filter((i: any) => i.category_id !== id);
    await db.write();
    res.json({ success: true });
  });

  app.post("/api/admin/items", async (req, res) => {
    const newItem = { ...req.body, id: Date.now() };
    db.data.items.push(newItem);
    await db.write();
    res.status(201).json(newItem);
  });

  app.delete("/api/admin/items/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    db.data.items = db.data.items.filter((i: any) => i.id !== id);
    await db.write();
    res.json({ success: true });
  });

  app.patch("/api/admin/orders/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const order = db.data.orders.find((o: any) => o.id === id);
    if (order) {
      order.status = status;
      await db.write();
      io.emit("order_updated", order);
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  // API Catch-all (to prevent falling through to Vite for non-existent API routes)
  app.use("/api", (req, res) => {
    console.log(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({ error: "API Route Not Found", path: req.url });
  });

  // --- 3. VITE MIDDLEWARE ---
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`
================================================
  ✅ SERVER IS RUNNING (LOWDB VERSION)
  🚀 PORT: ${PORT}
  🔗 HEALTH: /api/health
================================================
    `);
  });
}

startServer().catch(err => {
  console.error("CRITICAL SERVER ERROR:", err);
  process.exit(1);
});
