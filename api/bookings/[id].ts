import type { VercelRequest, VercelResponse } from '@vercel/node';
import { run } from '../_db';
import { getUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();
  const user = getUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { id } = req.query;
  const { status } = req.body;
  await run('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
  res.json({ success: true });
}
