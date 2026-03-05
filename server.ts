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
        return {
          categories: parsed.categories || initialDb.categories,
          items: parsed.items || initialDb.items,
          orders: parsed.orders || []
        };
      }
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

  // --- 2. PRIORITY API MIDDLEWARE (BRUTE FORCE) ---
  // We handle these BEFORE everything else to ensure no interception by Vite
  app.use((req, res, next) => {
    // Force JSON for all /internal-db requests
    if (req.url.includes('/internal-db/')) {
      res.setHeader('Content-Type', 'application/json');
      const db = getDb();

      if (req.url.includes('/menu')) {
        return res.json({ categories: db.categories, items: db.items });
      }
      if (req.url.includes('/orders')) {
        if (req.method === 'GET') return res.json(db.orders);
        if (req.method === 'POST') {
          const newOrder = { ...req.body, id: Date.now(), status: 'pending', created_at: new Date().toISOString() };
          db.orders.push(newOrder);
          saveDb(db);
          io.emit("new_order", newOrder);
          return res.status(201).json(newOrder);
        }
      }
      if (req.url.includes('/admin/categories')) {
        if (req.method === 'POST') {
          const newCat = { ...req.body, id: Date.now() };
          db.categories.push(newCat);
          saveDb(db);
          return res.status(201).json(newCat);
        }
        if (req.method === 'DELETE') {
          const id = parseInt(req.url.split('/').pop() || "0");
          db.categories = db.categories.filter((c: any) => c.id !== id);
          db.items = db.items.filter((i: any) => i.category_id !== id);
          saveDb(db);
          return res.json({ success: true });
        }
      }
      if (req.url.includes('/admin/items')) {
        if (req.method === 'POST') {
          const newItem = { ...req.body, id: Date.now() };
          db.items.push(newItem);
          saveDb(db);
          return res.status(201).json(newItem);
        }
        if (req.method === 'DELETE') {
          const id = parseInt(req.url.split('/').pop() || "0");
          db.items = db.items.filter((i: any) => i.id !== id);
          saveDb(db);
          return res.json({ success: true });
        }
      }
    }
    next();
  });

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
      if (req.url.includes('/internal-db/')) return res.status(404).json({ error: "Not Found" });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("SERVER READY ON PORT 3000 - API AT /internal-db/");
  });
}

startServer();
