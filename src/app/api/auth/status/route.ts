import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TOKEN_COOKIE } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ pro: false });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ pro: false });
  }

  return NextResponse.json({ pro: true });
}
