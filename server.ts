import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

// --- DATABASE ENGINE ---
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
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch (e) {}
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

  // --- 1. PRIORITY API ROUTES ---
  // We handle these BEFORE anything else
  app.post("/save-order-now", (req, res) => {
    console.log(">>> [SERVER] Saving Order");
    const db = getDb();
    const newOrder = { ...req.body, id: Date.now(), status: 'pending', created_at: new Date().toISOString() };
    db.orders.push(newOrder);
    saveDb(db);
    io.emit("new_order", newOrder);
    res.setHeader('Content-Type', 'application/json');
    return res.status(201).json(newOrder);
  });

  app.get("/get-menu-now", (req, res) => {
    console.log(">>> [SERVER] Serving Menu");
    const db = getDb();
    res.setHeader('Content-Type', 'application/json');
    return res.json({ categories: db.categories, items: db.items });
  });

  // --- ADMIN ROUTES ---
  app.post("/admin-api/categories", (req, res) => {
    const db = getDb();
    const newCategory = { ...req.body, id: Date.now() };
    db.categories.push(newCategory);
    saveDb(db);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(newCategory);
  });

  app.delete("/admin-api/categories/:id", (req, res) => {
    const db = getDb();
    db.categories = db.categories.filter((c: any) => c.id !== parseInt(req.params.id));
    db.items = db.items.filter((i: any) => i.category_id !== parseInt(req.params.id));
    saveDb(db);
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true });
  });

  app.post("/admin-api/items", (req, res) => {
    const db = getDb();
    const newItem = { ...req.body, id: Date.now() };
    db.items.push(newItem);
    saveDb(db);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(newItem);
  });

  app.delete("/admin-api/items/:id", (req, res) => {
    const db = getDb();
    db.items = db.items.filter((i: any) => i.id !== parseInt(req.params.id));
    saveDb(db);
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true });
  });

  // --- 2. VITE / STATIC ---
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
      // Final guard: if it's a data request that reached here, return 404 JSON, not HTML
      if (req.url.includes('now')) return res.status(404).json({ error: "Not Found" });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("ULTRA-STABLE SERVER READY");
  });
}

startServer();
