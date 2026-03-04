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
  } catch (e) { console.error("DB Read Error:", e); }
  return initialDb;
}

function saveDb(data: any) {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); } catch (e) { console.error("DB Save Error:", e); }
}

// --- 2. SERVER STARTUP ---
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  
  app.use(express.json());

  // --- 3. LOGGING MIDDLEWARE ---
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });

  // --- 4. ISOLATED DATABASE ROUTES ---
  // We use /internal-db instead of /api to avoid any Vite/Proxy interference
  const dbRouter = express.Router();

  dbRouter.get("/menu", (req, res) => {
    console.log(">>> Serving Menu Data");
    const db = getDb();
    res.json({ categories: db.categories, items: db.items });
  });

  dbRouter.post("/orders", (req, res) => {
    console.log(">>> Saving New Order");
    const db = getDb();
    const newOrder = { ...req.body, id: Date.now(), status: 'pending', created_at: new Date().toISOString() };
    db.orders.push(newOrder);
    saveDb(db);
    io.emit("new_order", newOrder);
    res.status(201).json(newOrder);
  });

  app.use("/internal-db", dbRouter);

  // --- 5. VITE / STATIC ASSETS ---
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Ensure API routes are NOT handled by Vite
    app.use((req, res, next) => {
      if (req.url.startsWith('/internal-db')) return next();
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.url.startsWith('/internal-db')) return res.status(404).json({ error: "Not Found" });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("SERVER READY ON PORT 3000 - DB PATH: /internal-db");
  });
}

startServer();
