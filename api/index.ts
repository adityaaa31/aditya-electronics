<<<<<<< HEAD
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, run, getOne, initDB } from './_db';
import { signToken, getUser } from './_auth';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url?.split('?')[0] || '';
  const method = req.method || 'GET';

  // Strip /api prefix
  const path = url.replace(/^\/api/, '');

  try {
    // Health
    if (path === '/health') {
      return res.json({ status: 'ok' });
    }

    // Cloudinary signed upload
    if (path === '/upload-sign' && method === 'POST') {
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const timestamp = Math.round(Date.now() / 1000);
      const params = `timestamp=${timestamp}`;
      const signature = crypto
        .createHash('sha256')
        .update(params + process.env.CLOUDINARY_API_SECRET)
        .digest('hex');
      return res.json({
        timestamp,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      });
    }

    // Setup
    if (path === '/setup') {
      if (req.query.secret !== process.env.SETUP_SECRET) return res.status(403).json({ error: 'Forbidden' });
      await initDB();
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@storeadityaelectronics@gmail.com';
      const existing = await getOne('SELECT id FROM users WHERE email = ?', [adminEmail]);
      if (!existing) {
        const hashed = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Satish@3122', 10);
        await run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Admin', adminEmail, hashed, 'admin']);
      } else {
        await run('UPDATE users SET role = ? WHERE email = ?', ['admin', adminEmail]);
      }
      for (const cat of ['Motherboard', 'Backlight', 'Remote', 'Panel', 'Power Supply']) {
        try { await run('INSERT INTO categories (name) VALUES (?)', [cat]); } catch {}
      }
      return res.json({ success: true, message: 'Database initialized and seeded' });
    }

    // Auth
    if (path === '/auth/login' && method === 'POST') {
      const { identifier, password } = req.body;
      const user: any = await getOne('SELECT * FROM users WHERE email = ? OR phone = ?', [identifier, identifier]);
      if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
      const token = signToken({ id: user.id, role: user.role });
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
    }

    if (path === '/auth/request-otp' && method === 'POST') {
      const { identifier } = req.body;
      if (!identifier?.includes('@')) return res.status(400).json({ error: 'Only email OTP is supported' });
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await run('DELETE FROM otps WHERE identifier = ?', [identifier]);
      await run('INSERT INTO otps (identifier, otp, expires_at) VALUES (?, ?, ?)', [identifier, otp, expiresAt]);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER || '', pass: (process.env.EMAIL_PASS || '').replace(/\s/g, '') }
      });
      try {
        await transporter.sendMail({
          from: `"Aditya Electronics" <${process.env.EMAIL_USER}>`,
          to: identifier,
          subject: 'Your OTP for Aditya Electronics',
          html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;"><h2 style="color:#dc2626;">Aditya Electronics</h2><p>Your OTP:</p><div style="font-size:32px;font-weight:bold;color:#dc2626;margin:20px 0;">${otp}</div><p>Valid for 10 minutes.</p></div>`
        });
        return res.json({ success: true });
      } catch (e: any) {
        return res.status(500).json({ error: 'Failed to send OTP email.' });
      }
    }

    if (path === '/auth/register' && method === 'POST') {
      const { name, email, phone, password, otp } = req.body;
      const identifier = email || phone;
      if (!identifier) return res.status(400).json({ error: 'Email or Phone is required' });
      if (email) {
        const otpRecord: any = await getOne('SELECT * FROM otps WHERE identifier = ? AND otp = ?', [identifier, otp]);
        if (!otpRecord || new Date(otpRecord.expires_at) < new Date()) return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = await run('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)', [name, email || null, phone || null, hashedPassword]);
        if (email) await run('DELETE FROM otps WHERE identifier = ?', [identifier]);
        const token = signToken({ id: result.id, role: 'customer' });
        return res.json({ token, user: { id: result.id, name, email, phone, role: 'customer' } });
      } catch (e: any) {
        if (e.message?.includes('Duplicate') || e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Email or Phone already registered' });
        return res.status(400).json({ error: e.message || 'Registration failed' });
      }
    }

    // Categories
    if (path === '/categories' || path === '/admin/categories') {
      if (method === 'GET') return res.json(await query('SELECT * FROM categories'));
      if (method === 'POST') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { name } = req.body;
        try {
          const result = await run('INSERT INTO categories (name) VALUES (?)', [name]);
          return res.json({ id: result.id, name });
        } catch (e: any) { return res.status(400).json({ error: e.message }); }
      }
    }

    const catMatch = path.match(/^\/(?:admin\/)?categories\/(\d+)$/);
    if (catMatch) {
      if (method !== 'DELETE') return res.status(405).end();
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const id = catMatch[1];
      const count: any = await getOne('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
      if (parseInt(count.count) > 0) return res.status(400).json({ error: 'Category is used by products' });
      await run('DELETE FROM categories WHERE id = ?', [id]);
      return res.json({ success: true });
    }

    // Products
    if (path === '/products' || path === '/admin/products') {
      if (method === 'GET') {
        const products = await query(`SELECT p.*, c.name as category_name, (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image FROM products p LEFT JOIN categories c ON p.category_id = c.id`);
        return res.json(products);
      }
      if (method === 'POST') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { name, description, price, category_id, warranty, images } = req.body;
        const result = await run('INSERT INTO products (name, description, price, category_id, warranty) VALUES (?, ?, ?, ?, ?)', [name, description, price, category_id, warranty]);
        if (images?.length) for (const url of images) await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [result.id, url]);
        return res.json({ id: result.id });
      }
    }

    const prodMatch = path.match(/^\/(?:admin\/)?products\/(\d+)$/);
    if (prodMatch) {
      const id = prodMatch[1];
      if (method === 'GET') {
        const product = await getOne(`SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`, [id]);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        const images = await query('SELECT * FROM product_images WHERE product_id = ?', [id]);
        return res.json({ ...product, images });
      }
      if (method === 'PATCH') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { name, description, price, category_id, warranty, images } = req.body;
        await run('UPDATE products SET name=?,description=?,price=?,category_id=?,warranty=? WHERE id=?', [name, description, price, category_id, warranty, id]);
        if (images?.length) for (const url of images) await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [id, url]);
        return res.json({ success: true });
      }
      if (method === 'DELETE') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const chats = await query('SELECT id FROM chats WHERE product_id = ?', [id]);
        for (const chat of chats) await run('DELETE FROM messages WHERE chat_id = ?', [(chat as any).id]);
        await run('DELETE FROM chats WHERE product_id = ?', [id]);
        await run('DELETE FROM product_images WHERE product_id = ?', [id]);
        await run('DELETE FROM products WHERE id = ?', [id]);
        return res.json({ success: true });
      }
    }

    // Services
    if (path === '/services' || path === '/admin/services') {
      if (method === 'GET') return res.json(await query('SELECT * FROM services'));
      if (method === 'POST') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { name, description, price, warranty, image_url } = req.body;
        await run('INSERT INTO services (name,description,price,warranty,image_url) VALUES (?,?,?,?,?)', [name, description, price, warranty, image_url || null]);
        return res.json({ success: true });
      }
    }

    const svcMatch = path.match(/^\/(?:admin\/)?services\/(\d+)$/);
    if (svcMatch) {
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const id = svcMatch[1];
      if (method === 'PATCH') {
        const { name, description, price, warranty, image_url } = req.body;
        await run('UPDATE services SET name=?,description=?,price=?,warranty=?,image_url=? WHERE id=?', [name, description, price, warranty, image_url, id]);
        return res.json({ success: true });
      }
      if (method === 'DELETE') {
        await run('DELETE FROM services WHERE id = ?', [id]);
        return res.json({ success: true });
      }
    }

    // Bookings
    if (path === '/bookings') {
      if (method === 'POST') {
        const { user_id, service_id, details, full_name, phone_number, email, address, locality } = req.body;
        const result = await run('INSERT INTO bookings (user_id,service_id,details,full_name,phone_number,email,address,locality) VALUES (?,?,?,?,?,?,?,?)', [user_id || null, service_id, details, full_name, phone_number, email, address, locality]);
        return res.json({ id: result.id });
      }
      if (method === 'GET') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const bookings = await query(`SELECT b.*, s.name as service_name FROM bookings b JOIN services s ON b.service_id = s.id ORDER BY b.created_at DESC`);
        return res.json(bookings);
      }
    }

    const bookingMatch = path.match(/^\/bookings\/(\d+)$/);
    if (bookingMatch) {
      if (method !== 'PATCH') return res.status(405).end();
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { status } = req.body;
      await run('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingMatch[1]]);
      return res.json({ success: true });
    }

    // Chats
    if (path === '/chats') {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (method === 'GET') {
        const chats = user.role === 'admin'
          ? await query(`SELECT c.*, u.name as user_name, p.name as product_name FROM chats c JOIN users u ON c.user_id = u.id JOIN products p ON c.product_id = p.id`)
          : await query(`SELECT c.*, p.name as product_name FROM chats c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`, [user.id]);
        return res.json(chats);
      }
      if (method === 'POST') {
        const { product_id } = req.body;
        await run('INSERT IGNORE INTO chats (user_id, product_id) VALUES (?, ?)', [user.id, product_id]);
        const chat: any = await getOne('SELECT id FROM chats WHERE user_id=? AND product_id=?', [user.id, product_id]);
        return res.json({ id: chat.id });
      }
    }

    const msgMatch = path.match(/^\/chats\/(\d+)\/messages$/);
    if (msgMatch) {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const id = msgMatch[1];
      if (method === 'GET') {
        const messages = await query(`SELECT m.*, u.name as sender_name, u.role as sender_role FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.chat_id = ? ORDER BY m.created_at ASC`, [id]);
        return res.json(messages);
      }
      if (method === 'POST') {
        const { message } = req.body;
        const result = await run('INSERT INTO messages (chat_id, sender_id, message) VALUES (?, ?, ?)', [id, user.id, message]);
        const msg = await query(`SELECT m.*, u.name as sender_name, u.role as sender_role FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`, [result.id]);
        return res.json(msg[0]);
      }
    }

    // Admin DB info
    if (path === '/admin/db-info') {
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const tables = ['users', 'products', 'categories', 'services', 'bookings', 'chats', 'messages'];
      const info = [];
      for (const table of tables) {
        const count: any = await getOne(`SELECT COUNT(*) as count FROM ${table}`);
        info.push({ table, count: parseInt(count.count) });
      }
      return res.json(info);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
=======
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, run, getOne, initDB } from './_db';
import { signToken, getUser } from './_auth';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url?.split('?')[0] || '';
  const method = req.method || 'GET';

  // Strip /api prefix
  const path = url.replace(/^\/api/, '');

  try {
    // Health
    if (path === '/health') {
      return res.json({ status: 'ok' });
    }

    // Cloudinary signed upload
    if (path === '/upload-sign' && method === 'POST') {
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const timestamp = Math.round(Date.now() / 1000);
      const params = `timestamp=${timestamp}`;
      const signature = crypto
        .createHash('sha256')
        .update(params + process.env.CLOUDINARY_API_SECRET)
        .digest('hex');
      return res.json({
        timestamp,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      });
    }

    // Setup
    if (path === '/setup') {
      if (req.query.secret !== process.env.SETUP_SECRET) return res.status(403).json({ error: 'Forbidden' });
      await initDB();
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@storeadityaelectronics@gmail.com';
      const existing = await getOne('SELECT id FROM users WHERE email = ?', [adminEmail]);
      if (!existing) {
        const hashed = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Satish@3122', 10);
        await run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Admin', adminEmail, hashed, 'admin']);
      } else {
        await run('UPDATE users SET role = ? WHERE email = ?', ['admin', adminEmail]);
      }
      for (const cat of ['Motherboard', 'Backlight', 'Remote', 'Panel', 'Power Supply']) {
        try { await run('INSERT INTO categories (name) VALUES (?)', [cat]); } catch {}
      }
      return res.json({ success: true, message: 'Database initialized and seeded' });
    }

    // Auth
    if (path === '/auth/login' && method === 'POST') {
      const { identifier, password } = req.body;
      const user: any = await getOne('SELECT * FROM users WHERE email = ? OR phone = ?', [identifier, identifier]);
      if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
      const token = signToken({ id: user.id, role: user.role });
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
    }

    if (path === '/auth/request-otp' && method === 'POST') {
      const { identifier } = req.body;
      if (!identifier?.includes('@')) return res.status(400).json({ error: 'Only email OTP is supported' });
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await run('DELETE FROM otps WHERE identifier = ?', [identifier]);
      await run('INSERT INTO otps (identifier, otp, expires_at) VALUES (?, ?, ?)', [identifier, otp, expiresAt]);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER || '', pass: (process.env.EMAIL_PASS || '').replace(/\s/g, '') }
      });
      try {
        await transporter.sendMail({
          from: `"Aditya Electronics" <${process.env.EMAIL_USER}>`,
          to: identifier,
          subject: 'Your OTP for Aditya Electronics',
          html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;"><h2 style="color:#dc2626;">Aditya Electronics</h2><p>Your OTP:</p><div style="font-size:32px;font-weight:bold;color:#dc2626;margin:20px 0;">${otp}</div><p>Valid for 10 minutes.</p></div>`
        });
        return res.json({ success: true });
      } catch (e: any) {
        return res.status(500).json({ error: 'Failed to send OTP email.' });
      }
    }

    if (path === '/auth/register' && method === 'POST') {
      const { name, email, phone, password, otp } = req.body;
      const identifier = email || phone;
      if (!identifier) return res.status(400).json({ error: 'Email or Phone is required' });
      if (email) {
        const otpRecord: any = await getOne('SELECT * FROM otps WHERE identifier = ? AND otp = ?', [identifier, otp]);
        if (!otpRecord || new Date(otpRecord.expires_at) < new Date()) return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = await run('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)', [name, email || null, phone || null, hashedPassword]);
        if (email) await run('DELETE FROM otps WHERE identifier = ?', [identifier]);
        const token = signToken({ id: result.id, role: 'customer' });
        return res.json({ token, user: { id: result.id, name, email, phone, role: 'customer' } });
      } catch (e: any) {
        if (e.message?.includes('Duplicate') || e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Email or Phone already registered' });
        return res.status(400).json({ error: e.message || 'Registration failed' });
      }
    }

    // Categories
    if (path === '/categories' || path === '/admin/categories') {
      if (method === 'GET') return res.json(await query('SELECT * FROM categories'));
      if (method === 'POST') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { name } = req.body;
        try {
          const result = await run('INSERT INTO categories (name) VALUES (?)', [name]);
          return res.json({ id: result.id, name });
        } catch (e: any) { return res.status(400).json({ error: e.message }); }
      }
    }

    const catMatch = path.match(/^\/(?:admin\/)?categories\/(\d+)$/);
    if (catMatch) {
      if (method !== 'DELETE') return res.status(405).end();
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const id = catMatch[1];
      const count: any = await getOne('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
      if (parseInt(count.count) > 0) return res.status(400).json({ error: 'Category is used by products' });
      await run('DELETE FROM categories WHERE id = ?', [id]);
      return res.json({ success: true });
    }

    // Products
    if (path === '/products' || path === '/admin/products') {
      if (method === 'GET') {
        const products = await query(`SELECT p.*, c.name as category_name, (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image FROM products p LEFT JOIN categories c ON p.category_id = c.id`);
        return res.json(products);
      }
      if (method === 'POST') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { name, description, price, category_id, warranty, images } = req.body;
        const result = await run('INSERT INTO products (name, description, price, category_id, warranty) VALUES (?, ?, ?, ?, ?)', [name, description, price, category_id, warranty]);
        if (images?.length) for (const url of images) await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [result.id, url]);
        return res.json({ id: result.id });
      }
    }

    const prodMatch = path.match(/^\/(?:admin\/)?products\/(\d+)$/);
    if (prodMatch) {
      const id = prodMatch[1];
      if (method === 'GET') {
        const product = await getOne(`SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`, [id]);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        const images = await query('SELECT * FROM product_images WHERE product_id = ?', [id]);
        return res.json({ ...product, images });
      }
      if (method === 'PATCH') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { name, description, price, category_id, warranty, images } = req.body;
        await run('UPDATE products SET name=?,description=?,price=?,category_id=?,warranty=? WHERE id=?', [name, description, price, category_id, warranty, id]);
        if (images?.length) for (const url of images) await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [id, url]);
        return res.json({ success: true });
      }
      if (method === 'DELETE') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const chats = await query('SELECT id FROM chats WHERE product_id = ?', [id]);
        for (const chat of chats) await run('DELETE FROM messages WHERE chat_id = ?', [(chat as any).id]);
        await run('DELETE FROM chats WHERE product_id = ?', [id]);
        await run('DELETE FROM product_images WHERE product_id = ?', [id]);
        await run('DELETE FROM products WHERE id = ?', [id]);
        return res.json({ success: true });
      }
    }

    // Services
    if (path === '/services' || path === '/admin/services') {
      if (method === 'GET') return res.json(await query('SELECT * FROM services'));
      if (method === 'POST') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { name, description, price, warranty, image_url } = req.body;
        await run('INSERT INTO services (name,description,price,warranty,image_url) VALUES (?,?,?,?,?)', [name, description, price, warranty, image_url || null]);
        return res.json({ success: true });
      }
    }

    const svcMatch = path.match(/^\/(?:admin\/)?services\/(\d+)$/);
    if (svcMatch) {
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const id = svcMatch[1];
      if (method === 'PATCH') {
        const { name, description, price, warranty, image_url } = req.body;
        await run('UPDATE services SET name=?,description=?,price=?,warranty=?,image_url=? WHERE id=?', [name, description, price, warranty, image_url, id]);
        return res.json({ success: true });
      }
      if (method === 'DELETE') {
        await run('DELETE FROM services WHERE id = ?', [id]);
        return res.json({ success: true });
      }
    }

    // Bookings
    if (path === '/bookings') {
      if (method === 'POST') {
        const { user_id, service_id, details, full_name, phone_number, email, address, locality } = req.body;
        const result = await run('INSERT INTO bookings (user_id,service_id,details,full_name,phone_number,email,address,locality) VALUES (?,?,?,?,?,?,?,?)', [user_id || null, service_id, details, full_name, phone_number, email, address, locality]);
        return res.json({ id: result.id });
      }
      if (method === 'GET') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const bookings = await query(`SELECT b.*, s.name as service_name FROM bookings b JOIN services s ON b.service_id = s.id ORDER BY b.created_at DESC`);
        return res.json(bookings);
      }
    }

    const bookingMatch = path.match(/^\/bookings\/(\d+)$/);
    if (bookingMatch) {
      if (method !== 'PATCH') return res.status(405).end();
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { status } = req.body;
      await run('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingMatch[1]]);
      return res.json({ success: true });
    }

    // Chats
    if (path === '/chats') {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (method === 'GET') {
        const chats = user.role === 'admin'
          ? await query(`SELECT c.*, u.name as user_name, p.name as product_name FROM chats c JOIN users u ON c.user_id = u.id JOIN products p ON c.product_id = p.id`)
          : await query(`SELECT c.*, p.name as product_name FROM chats c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`, [user.id]);
        return res.json(chats);
      }
      if (method === 'POST') {
        const { product_id } = req.body;
        await run('INSERT IGNORE INTO chats (user_id, product_id) VALUES (?, ?)', [user.id, product_id]);
        const chat: any = await getOne('SELECT id FROM chats WHERE user_id=? AND product_id=?', [user.id, product_id]);
        return res.json({ id: chat.id });
      }
    }

    const msgMatch = path.match(/^\/chats\/(\d+)\/messages$/);
    if (msgMatch) {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const id = msgMatch[1];
      if (method === 'GET') {
        const messages = await query(`SELECT m.*, u.name as sender_name, u.role as sender_role FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.chat_id = ? ORDER BY m.created_at ASC`, [id]);
        return res.json(messages);
      }
      if (method === 'POST') {
        const { message } = req.body;
        const result = await run('INSERT INTO messages (chat_id, sender_id, message) VALUES (?, ?, ?)', [id, user.id, message]);
        const msg = await query(`SELECT m.*, u.name as sender_name, u.role as sender_role FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`, [result.id]);
        return res.json(msg[0]);
      }
    }

    // Admin DB info
    if (path === '/admin/db-info') {
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const tables = ['users', 'products', 'categories', 'services', 'bookings', 'chats', 'messages'];
      const info = [];
      for (const table of tables) {
        const count: any = await getOne(`SELECT COUNT(*) as count FROM ${table}`);
        info.push({ table, count: parseInt(count.count) });
      }
      return res.json(info);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
>>>>>>> b05d12e (feat: image upload from gallery via Cloudinary)
