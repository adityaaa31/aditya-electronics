import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOne, query, run } from '../_db';
import { getUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const product = await getOne(`
      SELECT p.*, c.name as category_name FROM products p
      LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?
    `, [id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const images = await query('SELECT * FROM product_images WHERE product_id = ?', [id]);
    return res.json({ ...product, images });
  }

  if (req.method === 'PATCH') {
    const user = getUser(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, description, price, category_id, warranty, images } = req.body;
    await run('UPDATE products SET name=?,description=?,price=?,category_id=?,warranty=? WHERE id=?',
      [name, description, price, category_id, warranty, id]);
    if (images?.length) {
      for (const url of images) {
        await run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [id, url]);
      }
    }
    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    const user = getUser(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const chats = await query('SELECT id FROM chats WHERE product_id = ?', [id]);
    for (const chat of chats) await run('DELETE FROM messages WHERE chat_id = ?', [(chat as any).id]);
    await run('DELETE FROM chats WHERE product_id = ?', [id]);
    await run('DELETE FROM product_images WHERE product_id = ?', [id]);
    await run('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ success: true });
  }

  res.status(405).end();
}
