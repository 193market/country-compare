import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { license_key } = body;

    if (!license_key || typeof license_key !== 'string') {
      return NextResponse.json({ error: 'License key is required' }, { status: 400 });
    }

    const productId = process.env.GUMROAD_PRODUCT_ID;
    if (!productId) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify with Gumroad API
    const gumroadRes = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: productId,
        license_key: license_key.trim(),
      }),
    });

    const gumroadData = await gumroadRes.json();

    if (!gumroadData.success) {
      return NextResponse.json({ error: 'Invalid license key' }, { status: 401 });
    }

    // Check if refunded
    if (gumroadData.purchase?.refunded) {
      return NextResponse.json({ error: 'This license has been refunded' }, { status: 401 });
    }

    // Create JWT token
    const token = createToken(license_key.trim());

    const response = NextResponse.json({
      success: true,
      email: gumroadData.purchase?.email || '',
    });

    // Set cookie
    response.cookies.set('cc_pro_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
