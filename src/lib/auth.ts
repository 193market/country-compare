import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const TOKEN_COOKIE = 'cc_pro_token';

export function createToken(licenseKey: string): string {
  return jwt.sign({ licenseKey, pro: true }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { pro: boolean; licenseKey: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { pro: boolean; licenseKey: string };
    return decoded;
  } catch {
    return null;
  }
}

export { TOKEN_COOKIE };
