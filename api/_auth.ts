import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aditya_electronics_secret_key_2026';

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export function getUser(req: any) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(' ')[1];
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
