import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, run } from '../_db';
import { getUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return res.json(await query('SELECT * FROM services'));

  if (req.method === 'POST') {
    const user = getUser(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, description, price, warranty, image_url } = req.body;
    await run('INSERT INTO services (name,description,price,warranty,image_url) VALUES (?,?,?,?,?)',
      [name, description, price, warranty, image_url || null]);
    return res.json({ success: true });
  }

  res.status(405).end();
}
