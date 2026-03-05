import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { JSONFilePreset } from 'lowdb/node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

// --- 1. RELIABLE DATABASE (LOWDB) ---
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
  // Initialize LowDB
  const db = await JSONFilePreset(DB_PATH, defaultData);

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  
  app.use(express.json());

  // --- 2. DEBUG MIDDLEWARE ---
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // --- 3. THE "ONE AND ONLY" API (PRIORITY #1) ---
  // We use a very distinct path to avoid any Vite/Static interference
  
  // Menu
  app.get("/api/v1/menu", (req, res) => {
    res.json({ categories: db.data.categories, items: db.data.items });
  });

  // Orders
  app.get("/api/v1/orders", (req, res) => {
    res.json(db.data.orders || []);
  });

  app.post("/api/v1/orders", async (req, res) => {
    const newOrder = { 
      ...req.body, 
      id: Date.now(), 
      status: 'pending', 
      created_at: new Date().toISOString() 
    };
    db.data.orders.push(newOrder);
    await db.write();
    io.emit("new_order", newOrder);
    res.status(201).json(newOrder);
  });

  // Admin: Categories
  app.post("/api/v1/admin/categories", async (req, res) => {
    const newCat = { ...req.body, id: Date.now() };
    db.data.categories.push(newCat);
    await db.write();
    res.status(201).json(newCat);
  });

  app.delete("/api/v1/admin/categories/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    db.data.categories = db.data.categories.filter((c: any) => c.id !== id);
    db.data.items = db.data.items.filter((i: any) => i.category_id !== id);
    await db.write();
    res.json({ success: true });
  });

  // Admin: Items
  app.post("/api/v1/admin/items", async (req, res) => {
    const newItem = { ...req.body, id: Date.now() };
    db.data.items.push(newItem);
    await db.write();
    res.status(201).json(newItem);
  });

  app.delete("/api/v1/admin/items/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    db.data.items = db.data.items.filter((i: any) => i.id !== id);
    await db.write();
    res.json({ success: true });
  });

  // --- 4. VITE / STATIC (LOWER PRIORITY) ---
  const distPath = path.join(__dirname, "dist");
  const isProd = process.env.NODE_ENV === "production" || fs.existsSync(distPath);
  
  if (!isProd) {
    console.log(">>> Starting in DEVELOPMENT mode (Vite Middleware)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(">>> Starting in PRODUCTION mode (Static Assets)");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // If it's an API request that failed to match above, return 404 JSON
      if (req.url.startsWith('/api/v1')) {
        return res.status(404).json({ error: "API Route Not Found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`
================================================
  🚀 RESTAURANT SERVER READY
  📍 PORT: ${PORT}
  📂 DB: ${DB_PATH}
  🔗 API: /api/v1/
================================================
    `);
  });
}

startServer().catch(err => {
  console.error("FATAL SERVER ERROR:", err);
  process.exit(1);
});
