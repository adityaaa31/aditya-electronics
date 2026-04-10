import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOne, run } from '../_db';
import { signToken } from '../_auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, password, otp } = req.body;
  const identifier = email || phone;
  if (!identifier) return res.status(400).json({ error: 'Email or Phone is required' });

  if (email) {
    const otpRecord: any = await getOne('SELECT * FROM otps WHERE identifier = ? AND otp = ?', [identifier, otp]);
    if (!otpRecord || new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await run(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email || null, phone || null, hashedPassword]
    );
    if (email) await run('DELETE FROM otps WHERE identifier = ?', [identifier]);
    const token = signToken({ id: result.id, role: 'customer' });
    res.json({ token, user: { id: result.id, name, email, phone, role: 'customer' } });
  } catch (e: any) {
    if (e.message?.includes('Duplicate') || e.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email or Phone already registered' });
    }
    res.status(400).json({ error: e.message || 'Registration failed' });
  }
}
