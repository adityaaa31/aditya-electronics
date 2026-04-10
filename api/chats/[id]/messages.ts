import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, run } from '../../_db';
import { getUser } from '../../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.query;

  if (req.method === 'GET') {
    const messages = await query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ? ORDER BY m.created_at ASC
    `, [id]);
    return res.json(messages);
  }

  if (req.method === 'POST') {
    const { message } = req.body;
    const result = await run('INSERT INTO messages (chat_id, sender_id, message) VALUES (?, ?, ?)', [id, user.id, message]);
    const msg = await query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?
    `, [result.id]);
    return res.json(msg[0]);
  }

  res.status(405).end();
}
