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

-- Sample Data Seeding
INSERT INTO menu_items (id, department, name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image) VALUES 
('r1', 'restaurant', 'Wagyu Beef Filet', 'فیلیه لحم واغیو', 'Wagyu Sığır Filetosu', 'فیله‌ی گۆشتی واگیۆ', 'Truffle mashed potatoes, asparagus', 'ماش بطاطس الترفل، هلیون', 'Trüf mantarlı patates püresi, kuşkonmaz', 'پەتاتەی کوتراوی تروفڵ، ئەسپەراگۆس', 85, '🥩'),
('r2', 'restaurant', 'Lobster Tail', 'ذیل لوبستر', 'Istakoz Kuyruğu', 'کاڵەی لۆبستەر', 'Garlic herb butter, roasted vegetables', 'زبدة بالأعشاب والثوم، خضروات مشوية', 'Sarımsaklı tereyağı, közlenmiş sebزeler', 'کەرەی سیر و سەوزە، سەوزەی برژاو', 95, '🦞'),
('c1', 'cafe', 'Signature Espresso', 'إسبريسو مميز', 'İmza Espresso', 'ئێسپرێسۆی تایبەت', 'Double shot of our house blend', 'جرعة مزدوجة من مزيجنا الخاص', 'Özel karışımımızdan çift shot', 'دوو شۆتی تێکەڵەی ماڵەوەمان', 8, '☕'),
('l1', 'laundry', 'Suit Dry Cleaning', 'تنظيف جاف للبدلة', 'Takım Elbise Kuru Temizleme', 'پاککردنەوەی وشکی قات', 'Two-piece suit professional cleaning', 'تنظيف احترافي لبدلة من قطعتين', 'İki parçalı takım elbise temizliği', 'پاککردنەوەی پرۆفیشناڵی قاتی دوو پارچەیی', 45, '👔');
