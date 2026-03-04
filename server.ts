import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

// 1. DATA
let db = {
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

if (fs.existsSync(DB_PATH)) {
  try { db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")); } catch (e) {}
}

async function start() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  
  app.use(express.json());

  // 2. LOG ALL REQUESTS
  app.use((req, res, next) => {
    console.log(`[SERVER] ${req.method} ${req.url}`);
    next();
  });

  // 3. NEW UNIQUE API PATHS (TO AVOID VITE INTERCEPTION)
  app.get("/fetch-menu-data", (req, res) => {
    console.log(">>> HANDLING MENU DATA REQUEST");
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      categories: db.categories,
      items: db.items
    });
  });

  app.post("/submit-order-data", (req, res) => {
    const order = { ...req.body, id: Date.now(), status: 'pending', created_at: new Date().toISOString() };
    db.orders.push(order);
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    io.emit("new_order", order);
    return res.json(order);
  });

  // 4. VITE MIDDLEWARE
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
    console.log("SERVER STARTED ON PORT 3000 - API AT /fetch-menu-data");
  });
}

start();
