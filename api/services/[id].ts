import type { VercelRequest, VercelResponse } from '@vercel/node';
import { run } from '../_db';
import { getUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { name, description, price, warranty, image_url } = req.body;
    await run('UPDATE services SET name=?,description=?,price=?,warranty=?,image_url=? WHERE id=?',
      [name, description, price, warranty, image_url, id]);
    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    await run('DELETE FROM services WHERE id = ?', [id]);
    return res.json({ success: true });
  }

  res.status(405).end();
}
