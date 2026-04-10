import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initDB, run, getOne } from './_db';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple secret check to prevent public access
  if (req.query.secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await initDB();

    // Seed admin
    const adminEmail = 'adityakr.25102006@gmail.com';
    const existing = await getOne('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (!existing) {
      const hashed = bcrypt.hashSync('aditya@2026', 10);
      await run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Aditya Kumar', adminEmail, hashed, 'admin']);
    } else {
      await run('UPDATE users SET role = ? WHERE email = ?', ['admin', adminEmail]);
    }

    // Seed categories
    for (const cat of ['Motherboard', 'Backlight', 'Remote', 'Panel', 'Power Supply']) {
      try { await run('INSERT INTO categories (name) VALUES (?)', [cat]); } catch {}
    }

    // Seed services
    const services = [
      { name: 'LCD Repair', description: 'Expert repair for all LCD models', price: 500, warranty: '3 Months Repairing Warranty' },
      { name: 'LED Repair', description: 'Specialized LED TV repair services', price: 600, warranty: '6 Months Repairing Warranty' },
      { name: 'Screen Replacement', description: 'High-quality screen replacement for all sizes', price: 2000, warranty: '1 Year Repairing Warranty' },
    ];
    for (const s of services) {
      const exists = await getOne('SELECT id FROM services WHERE name = ?', [s.name]);
      if (!exists) await run('INSERT INTO services (name, description, price, warranty) VALUES (?, ?, ?, ?)',
        [s.name, s.description, s.price, s.warranty]);
    }

    // Seed Sample Products
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
        const result = await run('INSERT INTO products (name, description, price, category_id, warranty) VALUES (?, ?, ?, ?, ?)',
          [p.name, p.description, p.price, cat ? cat.id : 1, p.warranty]);
        await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [result.id, p.image]);
      }
    }

    res.json({ success: true, message: 'Database initialized and seeded' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
