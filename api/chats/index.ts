import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, run, getOne } from '../_db';
import { getUser } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const chats = user.role === 'admin'
      ? await query(`SELECT c.*, u.name as user_name, p.name as product_name FROM chats c JOIN users u ON c.user_id = u.id JOIN products p ON c.product_id = p.id`)
      : await query(`SELECT c.*, p.name as product_name FROM chats c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`, [user.id]);
    return res.json(chats);
  }

  if (req.method === 'POST') {
    const { product_id } = req.body;
    await run('INSERT IGNORE INTO chats (user_id, product_id) VALUES (?, ?)', [user.id, product_id]);
    const chat: any = await getOne('SELECT id FROM chats WHERE user_id=? AND product_id=?', [user.id, product_id]);
    return res.json({ id: chat.id });
  }

  res.status(405).end();
}
