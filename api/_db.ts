import mysql from 'mysql2/promise';

// Use a pool instead of single connection — required for serverless
let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: parseInt(process.env.MYSQL_PORT || '4000'),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function query(q: string, params: any[] = []) {
  const [rows] = await getPool().execute(q, params);
  return rows as any[];
}

export async function getOne(q: string, params: any[] = []) {
  const rows = await query(q, params);
  return rows[0] || null;
}

export async function run(q: string, params: any[] = []) {
  const [result]: any = await getPool().execute(q, params);
  return { id: result.insertId, affectedRows: result.affectedRows };
}

export async function initDB() {
  const p = getPool();
  await p.execute(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE, phone VARCHAR(20) UNIQUE, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'customer')`);
  await p.execute(`CREATE TABLE IF NOT EXISTS otps (id INT AUTO_INCREMENT PRIMARY KEY, identifier VARCHAR(255) NOT NULL, otp VARCHAR(10) NOT NULL, expires_at DATETIME NOT NULL)`);
  await p.execute(`CREATE TABLE IF NOT EXISTS categories (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL)`);
  await p.execute(`CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), category_id INT, warranty VARCHAR(255))`);
  await p.execute(`CREATE TABLE IF NOT EXISTS product_images (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT, image_url TEXT NOT NULL)`);
  await p.execute(`CREATE TABLE IF NOT EXISTS services (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), warranty VARCHAR(255), image_url TEXT)`);
  await p.execute(`CREATE TABLE IF NOT EXISTS bookings (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, service_id INT, details TEXT, status VARCHAR(20) DEFAULT 'pending', full_name VARCHAR(255), phone_number VARCHAR(20), email VARCHAR(255), address TEXT, locality VARCHAR(255), created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await p.execute(`CREATE TABLE IF NOT EXISTS chats (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, product_id INT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, product_id))`);
  await p.execute(`CREATE TABLE IF NOT EXISTS messages (id INT AUTO_INCREMENT PRIMARY KEY, chat_id INT, sender_id INT, message TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
}
