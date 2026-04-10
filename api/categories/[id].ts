import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOne, run } from '../_db';
import { getUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();
  const user = getUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { id } = req.query;
  const count: any = await getOne('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
  if (parseInt(count.count) > 0) return res.status(400).json({ error: 'Category is used by products' });
  await run('DELETE FROM categories WHERE id = ?', [id]);
  res.json({ success: true });
}
