import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, run, getOne, initDB } from './_db';
import { signToken, getUser } from './_auth';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url?.split('?')[0] || '';
  const method = req.method || 'GET';
  const path = url.replace(/^\/api/, '');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (method === 'OPTIONS') return res.status(200).end();

  try {
    // Health
    if (path === '/health') return res.json({ status: 'ok' });

    // Setup / DB init
    if (path === '/setup') {
      if (req.query.secret !== process.env.SETUP_SECRET) return res.status(403).json({ error: 'Forbidden' });
      await initDB();
      const adminEmail = 'adityakr.25102006@gmail.com';
      const existing = await getOne('SELECT id FROM users WHERE email = ?', [adminEmail]);
      if (!existing) {
        const hashed = bcrypt.hashSync('aditya@2026', 10);
        await run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Aditya Kumar', adminEmail, hashed, 'admin']);
      } else {
        await run('UPDATE users SET role = ? WHERE email = ?', ['admin', adminEmail]);
      }
      for (const cat of ['Motherboard', 'Backlight', 'Remote', 'Panel', 'Power Supply']) {
        try { await run('INSERT INTO categories (name) VALUES (?)', [cat]); } catch {}
      }
      const services = [
        { name: 'LCD Repair', description: 'Expert repair for all LCD models', price: 500, warranty: '3 Months Repairing Warranty' },
        { name: 'LED Repair', description: 'Specialized LED TV repair services', price: 600, warranty: '6 Months Repairing Warranty' },
        { name: 'Screen Replacement', description: 'High-quality screen replacement for all sizes', price: 2000, warranty: '1 Year Repairing Warranty' },
      ];
      for (const s of services) {
        const exists = await getOne('SELECT id FROM services WHERE name = ?', [s.name]);
        if (!exists) await run('INSERT INTO services (name, description, price, warranty) VALUES (?, ?, ?, ?)', [s.name, s.description, s.price, s.warranty]);
      }
      const prodCount: any = await getOne('SELECT COUNT(*) as count FROM products');
      if (parseInt(prodCount.count) === 0) {
        const sampleProducts = [
          { name: 'LG 32" Backlight Strip', price: 850, description: 'Original LG backlight strip for 32 inch models.', category: 'Backlight', warranty: '6 Months Warranty', image: 'https://placehold.co/600x400?text=Backlight+Strip' },
          { name: 'Universal LED Motherboard', price: 1200, description: 'V56 Universal motherboard for all LED TV models.', category: 'Motherboard', warranty: '1 Year Warranty', image: 'https://placehold.co/600x400?text=Motherboard' },
          { name: 'Samsung Smart Remote', price: 450, description: 'Original Samsung smart TV remote control.', category: 'Remote', warranty: 'No Warranty', image: 'https://placehold.co/600x400?text=Remote' },
          { name: '4K LED Panel 43"', price: 8500, description: 'High quality 4K replacement panel for 43 inch TVs.', category: 'Panel', warranty: '1 Year Warranty', image: 'https://placehold.co/600x400?text=LED+Panel' },
        ];
        for (const p of sampleProducts) {
          const cat: any = await getOne('SELECT id FROM categories WHERE name = ?', [p.category]);
          const result = await run('INSERT INTO products (name, description, price, category_id, warranty) VALUES (?, ?, ?, ?, ?)', [p.name, p.description, p.price, cat ? cat.id : 1, p.warranty]);
          await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [result.id, p.image]);
        }
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
          html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;"><h2 style="color:#dc2626;">Aditya Electronics</h2><p>Your OTP:</p><div style="font-size:32px;font-weight:bold;color:#dc2626;margin:20px 0;">${otp}</div><p>Valid for 10 minutes. Do not share it.</p></div>`
        });
        return res.json({ success: true });
      } catch (e: any) {
        console.error('Email error:', e);
        return res.status(500).json({ error: 'Failed to send OTP email.' });
      }
    }

    // Forgot password — reset via OTP
    if (path === '/auth/forgot-password' && method === 'POST') {
      const { email, otp, newPassword } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });

      // Step 1: just email provided — send OTP
      if (!otp && !newPassword) {
        const user: any = await getOne('SELECT id FROM users WHERE email = ?', [email]);
        if (!user) return res.status(404).json({ error: 'No account found with this email' });
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await run('DELETE FROM otps WHERE identifier = ?', [email]);
        await run('INSERT INTO otps (identifier, otp, expires_at) VALUES (?, ?, ?)', [email, otpCode, expiresAt]);
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER || '', pass: (process.env.EMAIL_PASS || '').replace(/\s/g, '') }
        });
        try {
          await transporter.sendMail({
            from: `"Aditya Electronics" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP - Aditya Electronics',
            html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;"><h2 style="color:#dc2626;">Aditya Electronics</h2><p>Your password reset OTP:</p><div style="font-size:32px;font-weight:bold;color:#dc2626;margin:20px 0;">${otpCode}</div><p>Valid for 10 minutes. Do not share it.</p></div>`
          });
          return res.json({ success: true });
        } catch (e: any) {
          return res.status(500).json({ error: 'Failed to send OTP email.' });
        }
      }

      // Step 2: email + otp + newPassword — verify and reset
      if (otp && newPassword) {
        if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        const otpRecord: any = await getOne('SELECT * FROM otps WHERE identifier = ? AND otp = ?', [email, otp]);
        if (!otpRecord || new Date(otpRecord.expires_at) < new Date()) return res.status(400).json({ error: 'Invalid or expired OTP' });
        const hashed = bcrypt.hashSync(newPassword, 10);
        await run('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
        await run('DELETE FROM otps WHERE identifier = ?', [email]);
        return res.json({ success: true, message: 'Password reset successfully' });
      }

      return res.status(400).json({ error: 'Invalid request' });
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
        const result = await run('INSERT INTO bookings (user_id,service_id,details,full_name,phone_number,email,address,locality) VALUES (?,?,?,?,?,?,?,?)', [user_id || null, service_id || null, details, full_name, phone_number, email, address, locality]);
        return res.json({ id: result.id });
      }
      if (method === 'GET') {
        const user = getUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const bookings = await query(`SELECT b.*, s.name as service_name FROM bookings b LEFT JOIN services s ON b.service_id = s.id ORDER BY b.created_at DESC`);
        return res.json(bookings);
      }
    }

    const bookingMatch = path.match(/^\/(?:admin\/)?bookings\/(\d+)$/);
    if (bookingMatch) {
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      if (method === 'PATCH') {
        const { status } = req.body;
        await run('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingMatch[1]]);
        return res.json({ success: true });
      }
      if (method === 'DELETE') {
        await run('DELETE FROM bookings WHERE id = ?', [bookingMatch[1]]);
        return res.json({ success: true });
      }
      return res.status(405).end();
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

    // Admin
    if (path === '/admin/change-password' && method === 'PATCH') {
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      const hashed = bcrypt.hashSync(newPassword, 10);
      await run('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
      return res.json({ success: true });
    }

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

    if (path === '/admin/bookings') {
      const user = getUser(req);
      if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const bookings = await query(`SELECT b.*, s.name as service_name FROM bookings b LEFT JOIN services s ON b.service_id = s.id ORDER BY b.created_at DESC`);
      return res.json(bookings);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
