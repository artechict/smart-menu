import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

// --- 1. ROBUST DATABASE LOGIC ---
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
      if (data.trim()) {
        const parsed = JSON.parse(data);
        // Ensure all required fields exist
        return {
          categories: parsed.categories || initialDb.categories,
          items: parsed.items || initialDb.items,
          orders: parsed.orders || []
        };
      }
    }
  } catch (e) {
    console.error("DB Read Error, using initial data");
  }
  return initialDb;
}

function saveDb(data: any) {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); } catch (e) {}
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  
  app.use(express.json());

  // --- 2. API ROUTES (Standard & Clean) ---
  const api = express.Router();

  api.get("/menu", (req, res) => {
    const db = getDb();
    res.setHeader('Content-Type', 'application/json');
    res.json({ categories: db.categories, items: db.items });
  });

  api.get("/orders", (req, res) => {
    const db = getDb();
    res.setHeader('Content-Type', 'application/json');
    res.json(db.orders || []);
  });

  api.post("/orders", (req, res) => {
    const db = getDb();
    const newOrder = { ...req.body, id: Date.now(), status: 'pending', created_at: new Date().toISOString() };
    if (!db.orders) db.orders = [];
    db.orders.push(newOrder);
    saveDb(db);
    io.emit("new_order", newOrder);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(newOrder);
  });

  api.post("/admin/categories", (req, res) => {
    const db = getDb();
    const newCat = { ...req.body, id: Date.now() };
    db.categories.push(newCat);
    saveDb(db);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(newCat);
  });

  api.delete("/admin/categories/:id", (req, res) => {
    const db = getDb();
    db.categories = db.categories.filter((c: any) => c.id !== parseInt(req.params.id));
    db.items = db.items.filter((i: any) => i.category_id !== parseInt(req.params.id));
    saveDb(db);
    res.json({ success: true });
  });

  api.post("/admin/items", (req, res) => {
    const db = getDb();
    const newItem = { ...req.body, id: Date.now() };
    db.items.push(newItem);
    saveDb(db);
    res.status(201).json(newItem);
  });

  api.delete("/admin/items/:id", (req, res) => {
    const db = getDb();
    db.items = db.items.filter((i: any) => i.id !== parseInt(req.params.id));
    saveDb(db);
    res.json({ success: true });
  });

  app.use("/api", api);

  // --- 3. VITE / STATIC ---
  const distPath = path.join(__dirname, "dist");
  const isProd = process.env.NODE_ENV === "production" && fs.existsSync(distPath);
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.url.startsWith('/api')) return res.status(404).json({ error: "Not Found" });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("SERVER READY ON PORT 3000 - API AT /api");
  });
}

startServer();
