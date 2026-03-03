import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

console.log("SERVER.TS STARTING (JSON DB MODE)...");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

// Helper to read/write JSON DB
function getDb() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading DB, using defaults");
    return { categories: [], items: [], orders: [] };
  }
}

function saveDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // Global Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/menu", (req, res) => {
    console.log(">>> API HIT: /api/menu");
    const db = getDb();
    res.json({ categories: db.categories, items: db.items });
  });

  app.post("/api/orders", (req, res) => {
    try {
      const { location_id, items, total } = req.body;
      const db = getDb();
      const newOrder = {
        id: Date.now(),
        location_id,
        items,
        total,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      db.orders.push(newOrder);
      saveDb(db);
      io.emit("new_order", newOrder);
      res.json(newOrder);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders", (req, res) => {
    const db = getDb();
    res.json(db.orders);
  });

  app.patch("/api/orders/:id/status", (req, res) => {
    const { status } = req.body;
    const db = getDb();
    const order = db.orders.find((o: any) => o.id === parseInt(req.params.id));
    if (order) {
      order.status = status;
      saveDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  // Catch-all for undefined API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
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
    console.log("Client connected");
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
