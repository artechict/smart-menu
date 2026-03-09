const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'hotel.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create tables
    db.serialize(() => {
      // Menu Items Table
      db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        department TEXT NOT NULL,
        name_en TEXT NOT NULL,
        name_ar TEXT,
        name_tr TEXT,
        name_ku TEXT,
        desc_en TEXT,
        desc_ar TEXT,
        desc_tr TEXT,
        desc_ku TEXT,
        price REAL NOT NULL,
        image TEXT
      )`);

      // Orders Table
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        roomNumber TEXT NOT NULL,
        guestName TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )`);

      // Order Items Table (Many-to-Many relationship)
      db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (item_id) REFERENCES menu_items(id)
      )`);

      // Seed Database if empty
      db.get("SELECT count(*) as count FROM menu_items", [], (err, row) => {
        if (row && row.count === 0) {
          console.log("Seeding database with initial data...");
          const seedData = [
            // Restaurant
            ['r1', 'restaurant', 'Wagyu Beef Filet', 'فيليه لحم واغيو', 'Wagyu Dana Fileto', 'گۆشتی واگیو', 'Truffle mashed potatoes, asparagus', 'بطاطس مهروسة بالكمأة، هليون', 'Trüflü patates püresi, kuşkonmaz', 'پەتاتەی بە ترافڵ، ئەسپاراگوس', 85, '🥩'],
            ['r2', 'restaurant', 'Lobster Tail', 'ذيل جراد البحر', 'Istakoz Kuyruğu', 'كلکی لۆبستەر', 'Garlic herb butter, roasted seasonal vegetables', 'زبدة بالأعشاب والثوم، خضروات موسمية مشوية', 'Sarımsaklı otlu tereyağı, kavrulmuş mevsim sebzeleri', 'کەرەی سیر و گیایی، سەوزەواتی برژاو', 95, '🦞'],
            
            // Cafe
            ['c1', 'cafe', 'Signature Espresso', 'إسبريسو مميز', 'Özel Espresso', 'ئێسپرێسۆی تایبەت', 'Double shot of our house blend', 'جرعة مزدوجة من مزيجنا الخاص', 'Özel harmanımızın duble shotı', 'دوو شۆت لە قاوەی تایبەتی ئێمە', 8, '☕'],
            ['c2', 'cafe', 'Vanilla Bean Latte', 'لاتيه بالفانيليا', 'Vanilyalı Latte', 'لاتێی ڤانێلا', 'Espresso, steamed milk, real vanilla', 'إسبريسو، حليب مبخر، فانيليا حقيقية', 'Espresso, buharda pişmiş süt, gerçek vanilya', 'ئێسپرێسۆ، شیری گەرمکراو، ڤانێلای سروشتی', 12, '🥛'],
            
            // Laundry
            ['l1', 'laundry', 'Suit Dry Cleaning', 'تنظيف جاف للبدلة', 'Takım Elbise Kuru Temizleme', 'پاککردنەوەی وشکی قات', 'Two-piece suit professional cleaning', 'تنظيف احترافي لبدلة من قطعتين', 'İki parçalı takım elbise profesyonel temizliği', 'پاککردنەوەی پڕۆفیشناڵی قاتی دوو پارچەیی', 45, '👔'],
            ['l2', 'laundry', 'Express Wash & Fold', 'غسيل وطي سريع', 'Hızlı Yıkama ve Katlama', 'شوشتن و قەدکردنی خێرا', 'Per bag, returned same day', 'لكل كيس، يعاد في نفس اليوم', 'Çanta başına, aynı gün iade', 'بۆ هەر جانتایەک، هەمان ڕۆژ دەگەڕێتەوە', 35, '🧺']
          ];

          const stmt = db.prepare(`INSERT INTO menu_items 
            (id, department, name_en, name_ar, name_tr, name_ku, desc_en, desc_ar, desc_tr, desc_ku, price, image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
          
          seedData.forEach(item => {
            stmt.run(item);
          });
          stmt.finalize();
        }
      });
    });
  }
});

module.exports = db;
