import type { VercelRequest, VercelResponse } from '@vercel/node';
import { run } from '../_db';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { identifier } = req.body;
  if (!identifier?.includes('@')) return res.status(400).json({ error: 'Only email OTP is supported' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await run('DELETE FROM otps WHERE identifier = ?', [identifier]);
  await run('INSERT INTO otps (identifier, otp, expires_at) VALUES (?, ?, ?)', [identifier, otp, expiresAt]);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: (process.env.EMAIL_PASS || '').replace(/\s/g, '')
    }
  });

  try {
    await transporter.sendMail({
      from: `"Aditya Electronics" <${process.env.EMAIL_USER}>`,
      to: identifier,
      subject: 'Your OTP for Aditya Electronics',
      html: `
        <div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#dc2626;">Aditya Electronics</h2>
          <p>Your OTP for registration is:</p>
          <div style="font-size:32px;font-weight:bold;color:#dc2626;margin:20px 0;">${otp}</div>
          <p>Valid for 10 minutes. Do not share it.</p>
        </div>
      `
    });
    res.json({ success: true });
  } catch (e: any) {
    console.error('Email error:', e);
    res.status(500).json({ error: 'Failed to send OTP email. Check email configuration.' });
  }
}
