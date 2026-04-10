import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOne } from '../_db';
import { signToken } from '../_auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { identifier, password } = req.body;
  const user: any = await getOne('SELECT * FROM users WHERE email = ? OR phone = ?', [identifier, identifier]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken({ id: user.id, role: user.role });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
}
