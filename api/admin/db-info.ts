import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOne } from '../_db';
import { getUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const tables = ['users', 'products', 'categories', 'services', 'bookings', 'chats', 'messages'];
  const info = [];
  for (const table of tables) {
    const count: any = await getOne(`SELECT COUNT(*) as count FROM ${table}`);
    info.push({ table, count: parseInt(count.count) });
  }
  res.json(info);
}
