import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

// --- 1. DATABASE ENGINE ---
const initialDb = {
  categories: [
    { id: 1, name: "Appetizers", icon: "Soup" },
    { id: 2, name: "Main Course", icon: "Utensils" },
    { id: 3, name: "Desserts", icon: "IceCream" },
    { id: 4, name: "Drinks", icon: "Coffee" }
  ],
  items: [
    { id: 1, category_id: 1, name: "Garlic Bread", description: "Toasted bread with garlic butter and herbs", price: 5.99, image_url: "https://picsum.photos/seed/garlic/400/300" },
    { id: 2, category_id: 2, name: "Grilled Salmon", description: "Fresh salmon with asparagus and lemon butter", price: 24.50, image_url: "https://picsum.photos/seed/salmon/400/300" },
    { id: 3, category_id: 3, name: "Chocolate Lava Cake", description: "Warm chocolate cake with a molten center", price: 8.99, image_url: "https://picsum.photos/seed/cake/400/300" }
  ],
  orders: []
};

function getDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      if (data.trim()) return JSON.parse(data);
    }
  } catch (e) { console.error("DB Read Error"); }
  return initialDb;
}

function saveDb(data: any) {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); } catch (e) { console.error("DB Save Error"); }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  
  app.use(express.json());

  // --- 2. THE "GOLDEN" API ROUTES (PRIORITY #1) ---
  // These routes are registered BEFORE Vite to ensure they are never intercepted.
  const api = express.Router();

  // Middleware to force JSON and disable caching
  api.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  api.get("/menu", (req, res) => {
    console.log(">>> API: Serving Menu");
    const db = getDb();
    res.send(JSON.stringify({ categories: db.categories, items: db.items }));
  });

  api.get("/orders", (req, res) => {
    console.log(">>> API: Serving Orders");
    const db = getDb();
    res.send(JSON.stringify(db.orders || []));
  });

  api.post("/orders", (req, res) => {
    console.log(">>> API: Saving Order");
    const db = getDb();
    const newOrder = { ...req.body, id: Date.now(), status: 'pending', created_at: new Date().toISOString() };
    if (!db.orders) db.orders = [];
    db.orders.push(newOrder);
    saveDb(db);
    io.emit("new_order", newOrder);
    res.status(201).send(JSON.stringify(newOrder));
  });

  api.post("/admin/categories", (req, res) => {
    const db = getDb();
    const newCat = { ...req.body, id: Date.now() };
    db.categories.push(newCat);
    saveDb(db);
    res.status(201).send(JSON.stringify(newCat));
  });

  api.delete("/admin/categories/:id", (req, res) => {
    const db = getDb();
    const id = parseInt(req.params.id);
    db.categories = db.categories.filter((c: any) => c.id !== id);
    db.items = db.items.filter((i: any) => i.category_id !== id);
    saveDb(db);
    res.send(JSON.stringify({ success: true }));
  });

  api.post("/admin/items", (req, res) => {
    const db = getDb();
    const newItem = { ...req.body, id: Date.now() };
    db.items.push(newItem);
    saveDb(db);
    res.status(201).send(JSON.stringify(newItem));
  });

  api.delete("/admin/items/:id", (req, res) => {
    const db = getDb();
    const id = parseInt(req.params.id);
    db.items = db.items.filter((i: any) => i.id !== id);
    saveDb(db);
    res.send(JSON.stringify({ success: true }));
  });

  // Mount the API at /api-v1
  app.use("/api-v1", api);

  // --- 3. VITE / STATIC (LOWER PRIORITY) ---
  const distPath = path.join(__dirname, "dist");
  const isProd = process.env.NODE_ENV === "production" && fs.existsSync(distPath);
  
  if (!isProd) {
    console.log(">>> Starting in DEVELOPMENT mode (Vite)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(">>> Starting in PRODUCTION mode");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // If an API request somehow reached here, it's a 404
      if (req.url.startsWith('/api-v1')) return res.status(404).json({ error: "API Route Not Found" });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("========================================");
    console.log("  ULTRA-STABLE SERVER READY ON PORT 3000");
    console.log("  API BASE PATH: /api-v1");
    console.log("========================================");
  });
}

startServer();
