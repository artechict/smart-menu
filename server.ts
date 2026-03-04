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
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
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
  
  // --- THE "BRUTE FORCE" HANDLER ---
  // This runs BEFORE everything else to ensure no interception
  app.use((req, res, next) => {
    // 1. Handle Menu Fetch
    if (req.url.includes('/internal-db/menu')) {
      console.log(">>> [FORCE] Serving Menu JSON");
      const db = getDb();
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(JSON.stringify({ categories: db.categories, items: db.items }));
    }

    // 2. Handle Order Submission
    if (req.url.includes('/internal-db/orders') && req.method === 'POST') {
      console.log(">>> [FORCE] Saving Order JSON");
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const orderData = JSON.parse(body);
          const db = getDb();
          const newOrder = { ...orderData, id: Date.now(), status: 'pending', created_at: new Date().toISOString() };
          db.orders.push(newOrder);
          saveDb(db);
          io.emit("new_order", newOrder);
          res.setHeader('Content-Type', 'application/json');
          return res.status(201).send(JSON.stringify(newOrder));
        } catch (e) {
          return res.status(400).send(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return; // Stop here, don't call next()
    }

    next();
  });

  app.use(express.json());

  // --- VITE / STATIC ASSETS ---
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
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("ULTRA-ROBUST SERVER RUNNING ON PORT 3000");
  });
}

startServer();
