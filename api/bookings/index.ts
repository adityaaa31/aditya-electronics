import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, run } from '../_db';
import { getUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const { user_id, service_id, details, full_name, phone_number, email, address, locality } = req.body;
    const result = await run(
      'INSERT INTO bookings (user_id,service_id,details,full_name,phone_number,email,address,locality) VALUES (?,?,?,?,?,?,?,?)',
      [user_id || null, service_id, details, full_name, phone_number, email, address, locality]
    );
    return res.json({ id: result.id });
  }

  if (req.method === 'GET') {
    const user = getUser(req);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const bookings = await query(`
      SELECT b.*, s.name as service_name FROM bookings b
      JOIN services s ON b.service_id = s.id ORDER BY b.created_at DESC
    `);
    return res.json(bookings);
  }

  res.status(405).end();
}
