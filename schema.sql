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

-- Seed data for menu items with real images and translations
INSERT INTO menu_items (id, department, name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image) VALUES 
('r1', 'restaurant', 'Wagyu Beef Filet', 'فیلیه لحم واغیو', 'Wagyu Sığır Filetosu', 'فیله‌ی گۆشتی واگیۆ', 'Gourmet Wagyu beef seared to perfection with truffle mashed potatoes.', 'لحم واغيو فاخر مشوي مع بطاطس مهروسة بالكمأ.', 'Trüf mantarlı patates püresi ile mükemmel şekilde mühürlenmiş gurme Wagyu sığırı.', 'گۆشتی واگیۆی نایاب کە بە باشی برژاوە لەگەڵ پەتاتەی کوتراوی تڕوڕ.', 85.00, '/assets/menu/wagyu.png'),
('r2', 'restaurant', 'Lobster Tail', 'ذیل لوبستر', 'Istakoz Kuyruğu', 'کاڵەی لۆبستەر', 'Succulent grilled lobster tail with garlic herb butter.', 'ذيل استاكوزا مشوي مع زبدة الثوم والأعشاب.', 'Sarımsaklı otlu tereyağı ile nefis ızgara istakoz kuyruğu.', 'کلکی لۆبستەری برژاو لەگەڵ کەرەی سیر و سەوزەوات.', 95.00, '/assets/menu/lobster.png'),
('c1', 'cafe', 'Signature Espresso', 'إسبريسو مميز', 'İmza Espresso', 'ئێسپرێسۆی تایبەت', 'A bold, premium double shot of our house artisan blend.', 'حقنة مزدوجة قوية ومتميزة من مزيجنا الحرفي.', 'Ev yapımı zanaatkar karışımımızın cesur, birinci sınıf çift shotu.', 'ژەمێکی دوو هێندەی بەهێز لە تێکەڵەی تایبەتیمان.', 8.00, '/assets/menu/espresso.png'),
('l1', 'laundry', 'Executive Suit Care', 'عناية بالبدلة التنفيذية', 'Takım Elbise Kuru Temizleme', 'خزمەتگوزاری قاتی فەرمی', 'Professional dry cleaning and precision pressing.', 'تنظيف جاف احترافي وكوي دقيق.', 'Profesyonel kuru temizleme ve hassas ütüleme.', 'شوشتنی وشک و ئوتووکردنی وردی پڕۆفیشناڵ.', 45.00, '/assets/menu/suit.png');
