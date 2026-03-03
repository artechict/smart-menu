import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("menu.db");
console.log("Database connected.");

// Initialize Database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      available INTEGER DEFAULT 1,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Database tables initialized successfully.");
} catch (err) {
  console.error("Database initialization error:", err);
}

// Seed initial data if empty
const categoryCount = db.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insertCat = db.prepare("INSERT INTO categories (name, icon) VALUES (?, ?)");
  insertCat.run("Appetizers", "Soup");
  insertCat.run("Main Course", "Utensils");
  insertCat.run("Desserts", "IceCream");
  insertCat.run("Drinks", "Coffee");

  const insertItem = db.prepare("INSERT INTO items (category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?)");
  insertItem.run(1, "Garlic Bread", "Toasted bread with garlic butter and herbs", 5.99, "https://picsum.photos/seed/garlic/400/300");
  insertItem.run(2, "Grilled Salmon", "Fresh salmon with asparagus and lemon butter", 24.50, "https://picsum.photos/seed/salmon/400/300");
  insertItem.run(3, "Chocolate Lava Cake", "Warm chocolate cake with a molten center", 8.99, "https://picsum.photos/seed/cake/400/300");
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/menu", (req, res) => {
    try {
      console.log("Fetching menu data...");
      const categories = db.prepare("SELECT * FROM categories").all();
      const items = db.prepare("SELECT * FROM items").all();
      res.json({ categories, items });
    } catch (error) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/categories", (req, res) => {
    const { name, icon } = req.body;
    const result = db.prepare("INSERT INTO categories (name, icon) VALUES (?, ?)").run(name, icon);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/categories/:id", (req, res) => {
    db.prepare("DELETE FROM items WHERE category_id = ?").run(req.params.id);
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/items", (req, res) => {
    const { category_id, name, description, price, image_url } = req.body;
    const result = db.prepare("INSERT INTO items (category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?)").run(category_id, name, description, price, image_url);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/items/:id", (req, res) => {
    db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/orders", (req, res) => {
    const { location_id, items, total } = req.body;
    const result = db.prepare("INSERT INTO orders (location_id, items, total) VALUES (?, ?, ?)").run(location_id, JSON.stringify(items), total);
    const order = { id: result.lastInsertRowid, location_id, items, total, status: 'pending', created_at: new Date().toISOString() };
    
    io.emit("new_order", order);
    res.json(order);
  });

  app.get("/api/orders", (req, res) => {
    const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
    res.json(orders.map((o: any) => ({ ...o, items: JSON.parse(o.items) })));
  });

  app.patch("/api/orders/:id/status", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  io.on("connection", (socket) => {
    console.log("Client connected");
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
