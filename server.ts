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
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("DB Read Error:", e);
  }
  return initialDb;
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("DB Save Error:", e);
  }
}

// --- 2. SERVER STARTUP ---
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  
  app.use(express.json());

  // --- 3. DIRECT API ROUTES (NO ROUTER FOR MAXIMUM COMPATIBILITY) ---
  app.get("/api/menu", (req, res) => {
    console.log(">>> API HIT: /api/menu");
    const db = getDb();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ categories: db.categories, items: db.items });
  });

  app.get("/api/ping", (req, res) => {
    res.json({ status: "online", timestamp: new Date().toISOString() });
  });

  app.post("/api/orders", (req, res) => {
    console.log(">>> API HIT: POST /api/orders");
    const db = getDb();
    const newOrder = { 
      ...req.body, 
      id: Date.now(), 
      status: 'pending', 
      created_at: new Date().toISOString() 
    };
    db.orders.push(newOrder);
    saveDb(db);
    io.emit("new_order", newOrder);
    res.status(201).json(newOrder);
  });

  // --- 4. VITE INTEGRATION ---
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // Prevent HTML fallback for API routes
      if (req.url.startsWith('/api/')) return res.status(404).json({ error: "API not found" });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("SERVER READY ON PORT 3000");
  });
}

startServer();
