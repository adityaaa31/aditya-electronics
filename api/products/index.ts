import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, run } from '../_db';
import { getUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const products = await query(`
      SELECT p.*, c.name as category_name,
      (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
    `);
    return res.json(products);
  }

  if (req.method === 'POST') {
    const user = getUser(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, description, price, category_id, warranty, images } = req.body;
    const result = await run(
      'INSERT INTO products (name, description, price, category_id, warranty) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, category_id, warranty]
    );
    if (images?.length) {
      for (const url of images) {
        await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [result.id, url]);
      }
    }
    return res.json({ id: result.id });
  }

  res.status(405).end();
}
