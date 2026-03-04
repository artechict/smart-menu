import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

console.log("SERVER.TS STARTING (ROBUST MODE)...");
console.log("NODE_ENV:", process.env.NODE_ENV);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

// Simple In-Memory DB with File Persistence
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

// Load initial data if file exists
try {
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    db = JSON.parse(data);
    console.log("Database loaded from file.");
  }
} catch (err) {
  console.error("Error loading database file, using defaults.");
}

function saveDb() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Error saving database to file.");
  }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  // 1. GLOBAL LOGGER (MUST BE FIRST)
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // DIRECT API ROUTE AT THE TOP
  app.get("/api/menu", (req, res) => {
    console.log(">>> DIRECT HANDLER: /api/menu");
    res.json({ categories: db.categories, items: db.items });
  });

  // ROOT ROUTE FOR DEBUGGING
  app.get("/", (req, res, next) => {
    console.log(">>> ROOT HIT");
    next();
  });

  // 2. API ROUTES (DIRECTLY ON APP)
  app.get("/api/menu", (req, res) => {
    console.log(">>> HANDLER: /api/menu");
    res.json({ categories: db.categories, items: db.items });
  });

  app.get("/api/ping", (req, res) => {
    console.log(">>> HANDLER: /api/ping");
    res.json({ status: "ok" });
  });

  app.post("/api/orders", (req, res) => {
    console.log(">>> HANDLER: POST /api/orders");
    try {
      const { location_id, items, total } = req.body;
      const newOrder: any = {
        id: Date.now(),
        location_id,
        items,
        total,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      db.orders.push(newOrder);
      saveDb();
      io.emit("new_order", newOrder);
      res.json(newOrder);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders", (req, res) => {
    console.log(">>> HANDLER: GET /api/orders");
    res.json(db.orders);
  });

  app.patch("/api/orders/:id/status", (req, res) => {
    console.log(`>>> HANDLER: PATCH /api/orders/${req.params.id}`);
    const { status } = req.body;
    const order: any = db.orders.find((o: any) => o.id === parseInt(req.params.id));
    if (order) {
      order.status = status;
      saveDb();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  // 3. CATCH-ALL FOR /API TO PREVENT HTML FALLBACK
  app.all("/api/*", (req, res) => {
    console.log(`>>> API 404: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // 4. VITE MIDDLEWARE (FOR DEVELOPMENT)
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  io.on("connection", (socket) => {
    console.log("Client connected via Socket.io");
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
