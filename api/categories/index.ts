import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, run } from '../_db';
import { getUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return res.json(await query('SELECT * FROM categories'));

  if (req.method === 'POST') {
    const user = getUser(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name } = req.body;
    try {
      const result = await run('INSERT INTO categories (name) VALUES (?)', [name]);
      return res.json({ id: result.id, name });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  res.status(405).end();
}
