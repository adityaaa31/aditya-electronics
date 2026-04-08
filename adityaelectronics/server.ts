import express from "express";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import mysql from "mysql2/promise";
import multer from "multer";
import nodemailer from "nodemailer";
import fs from "fs";
import { fileURLToPath } from "url";
import { config } from "dotenv";

config(); // Load .env file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "aditya_electronics_secret_key_2026";

// Database Abstraction
let db: any;
const isMySQL = !!process.env.MYSQL_HOST;

async function initDB() {
  if (isMySQL) {
    db = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined
    });
    console.log("Connected to MySQL Database");
    
    // MySQL Init Schema
    await db.execute(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE, phone VARCHAR(20) UNIQUE, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'customer')`);
    await db.execute(`CREATE TABLE IF NOT EXISTS otps (id INT AUTO_INCREMENT PRIMARY KEY, identifier VARCHAR(255) NOT NULL, otp VARCHAR(10) NOT NULL, expires_at TIMESTAMP NOT NULL)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS categories (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), category_id INT, warranty VARCHAR(255), FOREIGN KEY (category_id) REFERENCES categories(id))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS product_images (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT, image_url TEXT NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS services (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), warranty VARCHAR(255), image_url TEXT)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS bookings (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, service_id INT, details TEXT, status VARCHAR(20) DEFAULT 'pending', full_name VARCHAR(255), phone_number VARCHAR(20), email VARCHAR(255), address TEXT, locality VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (service_id) REFERENCES services(id))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS chats (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, product_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, product_id), FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (product_id) REFERENCES products(id))`);
    await db.execute(`CREATE TABLE IF NOT EXISTS messages (id INT AUTO_INCREMENT PRIMARY KEY, chat_id INT, sender_id INT, message TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (chat_id) REFERENCES chats(id), FOREIGN KEY (sender_id) REFERENCES users(id))`);
  } else {
    db = new Database(process.env.DB_PATH || "database.sqlite");
    console.log("Using SQLite Database");
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE, phone TEXT UNIQUE, password TEXT NOT NULL, role TEXT DEFAULT 'customer');
      CREATE TABLE IF NOT EXISTS otps (id INTEGER PRIMARY KEY AUTOINCREMENT, identifier TEXT NOT NULL, otp TEXT NOT NULL, expires_at DATETIME NOT NULL);
      CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);
      CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, price REAL, category_id INTEGER, warranty TEXT, FOREIGN KEY (category_id) REFERENCES categories(id));
      CREATE TABLE IF NOT EXISTS product_images (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, image_url TEXT NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, price REAL, warranty TEXT, image_url TEXT);
      CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, service_id INTEGER, details TEXT, status TEXT DEFAULT 'pending', full_name TEXT, phone_number TEXT, email TEXT, address TEXT, locality TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (service_id) REFERENCES services(id));
      CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, product_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, product_id), FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER, sender_id INTEGER, message TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (chat_id) REFERENCES chats(id), FOREIGN KEY (sender_id) REFERENCES users(id));
    `);
  }
}

// Helper for DB queries
const query = async (sql: string, params: any[] = []) => {
  if (isMySQL) {
    const [rows] = await db.execute(sql, params);
    return rows;
  } else {
    return db.prepare(sql).all(...params);
  }
};

const getOne = async (sql: string, params: any[] = []) => {
  if (isMySQL) {
    const [rows]: any = await db.execute(sql, params);
    return rows[0];
  } else {
    return db.prepare(sql).get(...params);
  }
};

const run = async (sql: string, params: any[] = []) => {
  if (isMySQL) {
    const [result]: any = await db.execute(sql, params);
    return { lastInsertRowid: result.insertId };
  } else {
    const result = db.prepare(sql).run(...params);
    return { lastInsertRowid: result.lastInsertRowid };
  }
};

async function seed() {
  // Seed Admin
  const adminEmail = "adityakr.25102006@gmail.com";
  const existingAdmin = await getOne("SELECT * FROM users WHERE email = ?", [adminEmail]);
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync("aditya@2026", 10);
    await run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ["Aditya Kumar", adminEmail, hashedPassword, "admin"]);
  } else {
    // Ensure the existing user is an admin if they have this email
    await run("UPDATE users SET role = 'admin' WHERE email = ?", [adminEmail]);
  }

  // Seed Categories
  const categories = ["Motherboard", "Backlight", "Remote", "Panel", "Power Supply"];
  for (const cat of categories) {
    try { await run("INSERT INTO categories (name) VALUES (?)", [cat]); } catch (e) {}
  }

  // Seed Services
  const initialServices = [
    { name: "LCD Repair", description: "Expert repair for all LCD models", price: 500, warranty: "3 Months Repairing Warranty" },
    { name: "LED Repair", description: "Specialized LED TV repair services", price: 600, warranty: "6 Months Repairing Warranty" },
    { name: "Screen Replacement", description: "High-quality screen replacement for all sizes", price: 2000, warranty: "1 Year Repairing Warranty" }
  ];
  for (const s of initialServices) {
    const existing = await getOne("SELECT * FROM services WHERE name = ?", [s.name]);
    if (!existing) await run("INSERT INTO services (name, description, price, warranty) VALUES (?, ?, ?, ?)", [s.name, s.description, s.price, s.warranty]);
  }

  // Seed Sample Products
  const prodCount: any = await getOne("SELECT COUNT(*) as count FROM products");
  if ((prodCount.count || prodCount['COUNT(*)']) === 0) {
    const sampleProducts = [
      { name: "LG 32\" Backlight Strip", price: 850, description: "Original LG backlight strip for 32 inch models.", category: "Backlight", warranty: "6 Months Warranty" },
      { name: "Universal LED Motherboard", price: 1200, description: "V56 Universal motherboard for all LED TV models.", category: "Motherboard", warranty: "1 Year Warranty" },
      { name: "Samsung Smart Remote", price: 450, description: "Original Samsung smart TV remote control.", category: "Remote", warranty: "No Warranty" },
      { name: "4K LED Panel 43\"", price: 8500, description: "High quality 4K replacement panel for 43 inch TVs.", category: "Panel", warranty: "1 Year Warranty" }
    ];
    for (const p of sampleProducts) {
      const cat: any = await getOne("SELECT id FROM categories WHERE name = ?", [p.category]);
      const res = await run("INSERT INTO products (name, description, price, category_id, warranty) VALUES (?, ?, ?, ?, ?)", [p.name, p.description, p.price, cat ? cat.id : 1, p.warranty]);
      await run("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)", [res.lastInsertRowid, "https://picsum.photos/seed/" + p.name.replace(/\s/g, '') + "/600/400"]);
    }
  }
}

async function startServer() {
  await initDB();
  await seed();

  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const app = express();

  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Multer setup
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
  });
  const upload = multer({ storage });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  };

  // OTP Setup
  // NOTE: If using Gmail, you MUST use an "App Password", not your regular password.
  // Go to Google Account -> Security -> 2-Step Verification -> App Passwords to generate one.
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️  WARNING: EMAIL_USER or EMAIL_PASS not set. Email OTP will not work.");
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: (process.env.EMAIL_PASS || '').replace(/\s/g, '') // strip spaces from app password
    }
  });

  app.post("/api/auth/request-otp", async (req, res) => {
    const { identifier } = req.body; // email or phone
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    try {
      await run("DELETE FROM otps WHERE identifier = ?", [identifier]);
      await run("INSERT INTO otps (identifier, otp, expires_at) VALUES (?, ?, ?)", [identifier, otp, expiresAt]);

      if (identifier.includes("@")) {
        // Send Email OTP
        try {
          await transporter.sendMail({
            from: `"Aditya Electronics" <${process.env.EMAIL_USER || 'storeadityaelectronics@gmail.com'}>`,
            to: identifier,
            subject: "Your OTP for Aditya Electronics",
            text: `Your OTP for registration is: ${otp}. It is valid for 10 minutes.`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #dc2626;">Aditya Electronics</h2>
                <p>Hello,</p>
                <p>Your OTP for registration is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #dc2626; margin: 20px 0;">${otp}</div>
                <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
              </div>
            `
          });
          console.log(`OTP ${otp} sent to email ${identifier}`);
        } catch (error: any) {
          console.error("Email sending failed:", error);
          throw new Error("Failed to send OTP email. Please check the server configuration or try again later.");
        }
      } else {
        return res.status(400).json({ error: "OTP is only supported for email addresses." });
      }

      res.json({ success: true, message: "OTP sent successfully", otp: process.env.NODE_ENV === 'production' ? undefined : otp });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, phone, password, otp } = req.body;
    const identifier = email || phone;

    if (!identifier) return res.status(400).json({ error: "Email or Phone is required" });

    // OTP verification only for email registrations
    if (email) {
      const otpRecord: any = await getOne("SELECT * FROM otps WHERE identifier = ? AND otp = ?", [identifier, otp]);
      if (!otpRecord || new Date(otpRecord.expires_at) < new Date()) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
    }

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = await run("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)", [name, email || null, phone || null, hashedPassword]);

      // Cleanup OTP if email registration
      if (email) await run("DELETE FROM otps WHERE identifier = ?", [identifier]);

      const token = jwt.sign({ id: result.lastInsertRowid, role: "customer" }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: result.lastInsertRowid, name, email, phone, role: "customer" } });
    } catch (e: any) {
      if (e.message.includes("UNIQUE")) {
        return res.status(400).json({ error: "Email or Phone already registered" });
      }
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { identifier, password } = req.body;
    const user: any = await getOne("SELECT * FROM users WHERE email = ? OR phone = ?", [identifier, identifier]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  });

  // Product Routes
  app.get("/api/products", async (req, res) => {
    const products = await query(`
      SELECT p.*, c.name as category_name, 
      (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await getOne(`
      SELECT p.*, c.name as category_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const images = await query("SELECT * FROM product_images WHERE product_id = ?", [req.params.id]);
    res.json({ ...product, images });
  });

  app.get("/api/categories", async (req, res) => {
    const categories = await query("SELECT * FROM categories");
    res.json(categories);
  });

  app.post("/api/products", authenticate, isAdmin, upload.array("images"), async (req, res) => {
    const { name, description, price, category_id, warranty } = req.body;
    const result = await run("INSERT INTO products (name, description, price, category_id, warranty) VALUES (?, ?, ?, ?, ?)", [name, description, price, category_id, warranty]);
    const productId = result.lastInsertRowid;
    
    const files = req.files as Express.Multer.File[];
    if (files) {
      for (const file of files) {
        await run("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)", [productId, `/uploads/${file.filename}`]);
      }
    }
    res.json({ id: productId });
  });

  // Services Routes
  app.get("/api/services", async (req, res) => {
    const services = await query("SELECT * FROM services");
    res.json(services);
  });

  app.post("/api/bookings", async (req, res) => {
    const { user_id, service_id, details, full_name, phone_number, email, address, locality } = req.body;
    const result = await run(`
      INSERT INTO bookings (user_id, service_id, details, full_name, phone_number, email, address, locality) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id || null, service_id, details, full_name, phone_number, email, address, locality]);
    res.json({ id: result.lastInsertRowid });
  });

  // Admin Routes
  app.post("/api/admin/services", authenticate, isAdmin, upload.single("image"), async (req, res) => {
    const { name, description, price, warranty } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    await run("INSERT INTO services (name, description, price, warranty, image_url) VALUES (?, ?, ?, ?, ?)", [name, description, price, warranty, imageUrl]);
    res.json({ success: true });
  });

  app.patch("/api/admin/services/:id", authenticate, isAdmin, upload.single("image"), async (req, res) => {
    const { name, description, price, warranty } = req.body;
    let imageUrl = req.body.image_url;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    await run("UPDATE services SET name = ?, description = ?, price = ?, warranty = ?, image_url = ? WHERE id = ?", [name, description, price, warranty, imageUrl, req.params.id]);
    res.json({ success: true });
  });

  app.patch("/api/admin/products/:id", authenticate, isAdmin, upload.array("images"), async (req, res) => {
    const { name, description, price, category_id, warranty } = req.body;
    await run("UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, warranty = ? WHERE id = ?", [name, description, price, category_id, warranty, req.params.id]);
    
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      // If new images are uploaded, we might want to clear old ones or just add new ones.
      // For simplicity, let's just add new ones.
      for (const file of files) {
        await run("INSERT INTO product_images (product_id, image_url) VALUES (?, ?)", [req.params.id, `/uploads/${file.filename}`]);
      }
    }
    res.json({ success: true });
  });

  app.delete("/api/admin/services/:id", authenticate, isAdmin, async (req, res) => {
    await run("DELETE FROM services WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/admin/products/:id", authenticate, isAdmin, async (req, res) => {
    try {
      // Delete messages in chats for this product first
      const chats: any[] = await query("SELECT id FROM chats WHERE product_id = ?", [req.params.id]) as any[];
      for (const chat of chats) {
        await run("DELETE FROM messages WHERE chat_id = ?", [chat.id]);
      }
      // Delete chats for this product
      await run("DELETE FROM chats WHERE product_id = ?", [req.params.id]);
      // Delete related images
      await run("DELETE FROM product_images WHERE product_id = ?", [req.params.id]);
      // Delete product
      await run("DELETE FROM products WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/db-info", authenticate, isAdmin, async (req, res) => {
    const allowedTables = ["users", "products", "categories", "services", "bookings", "chats", "messages"];
    const info = [];
    for (const table of allowedTables) {
      const count: any = await getOne(`SELECT COUNT(*) as count FROM ${table}`);
      info.push({ table, count: count.count || count['COUNT(*)'] });
    }
    res.json(info);
  });

  app.get("/api/admin/bookings", authenticate, isAdmin, async (req, res) => {
    const bookings = await query(`
      SELECT b.*, s.name as service_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      ORDER BY b.created_at DESC
    `);
    res.json(bookings);
  });

  app.patch("/api/admin/bookings/:id", authenticate, isAdmin, async (req, res) => {
    const { status } = req.body;
    await run("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  });

  app.post("/api/admin/categories", authenticate, isAdmin, async (req, res) => {
    const { name } = req.body;
    try {
      const result = await run("INSERT INTO categories (name) VALUES (?)", [name]);
      res.json({ id: result.lastInsertRowid, name });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/admin/categories/:id", authenticate, isAdmin, async (req, res) => {
    try {
      // Check if any products are using this category
      const products: any = await getOne("SELECT COUNT(*) as count FROM products WHERE category_id = ?", [req.params.id]);
      const count = products.count || products['COUNT(*)'];
      if (count > 0) {
        return res.status(400).json({ error: "Cannot delete category as it is being used by products." });
      }
      await run("DELETE FROM categories WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/admin/change-password", authenticate, isAdmin, async (req: any, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    try {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);
      res.json({ success: true, message: "Password updated successfully" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Chat Routes
  app.get("/api/chats", authenticate, async (req: any, res) => {
    let chats;
    if (req.user.role === "admin") {
      chats = await query(`
        SELECT c.*, u.name as user_name, p.name as product_name
        FROM chats c
        JOIN users u ON c.user_id = u.id
        JOIN products p ON c.product_id = p.id
      `);
    } else {
      chats = await query(`
        SELECT c.*, p.name as product_name
        FROM chats c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
      `, [req.user.id]);
    }
    res.json(chats);
  });

  app.get("/api/chats/:id/messages", authenticate, async (req, res) => {
    const messages = await query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
    `, [req.params.id]);
    res.json(messages);
  });

  app.post("/api/chats", authenticate, async (req: any, res) => {
    const { product_id } = req.body;
    try {
      if (isMySQL) {
        await run("INSERT IGNORE INTO chats (user_id, product_id) VALUES (?, ?)", [req.user.id, product_id]);
      } else {
        await run("INSERT OR IGNORE INTO chats (user_id, product_id) VALUES (?, ?)", [req.user.id, product_id]);
      }
      const chat: any = await getOne("SELECT id FROM chats WHERE user_id = ? AND product_id = ?", [req.user.id, product_id]);
      res.json({ id: chat.id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Socket.io for Real-time Chat
  io.on("connection", (socket) => {
    socket.on("join_chat", (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on("send_message", async ({ chatId, senderId, message }) => {
      const result = await run("INSERT INTO messages (chat_id, sender_id, message) VALUES (?, ?, ?)", [chatId, senderId, message]);
      const msg: any = await getOne(`
        SELECT m.*, u.name as sender_name, u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `, [result.lastInsertRowid]);
      io.to(`chat_${chatId}`).emit("new_message", msg);
    });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      // Don't intercept API routes or static asset requests
      if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || /\.\w+$/.test(req.path)) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = parseInt(process.env.PORT || '3000');
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
