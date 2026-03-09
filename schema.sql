DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;

CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  department TEXT NOT NULL,
  name_en TEXT,
  name_ar TEXT,
  name_tr TEXT,
  name_ku TEXT,
  desc_en TEXT,
  desc_ar TEXT,
  desc_tr TEXT,
  desc_ku TEXT,
  price REAL NOT NULL,
  image TEXT
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  roomNumber TEXT NOT NULL,
  guestName TEXT NOT NULL,
  totalAmount REAL NOT NULL,
  status TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (item_id) REFERENCES menu_items(id)
);
