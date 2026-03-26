import { NextResponse } from 'next/server';

export async function GET() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Purchase Complete | CountryCompare</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: white; border-radius: 16px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
    h1 { font-size: 24px; color: #111827; margin: 16px 0 8px; }
    p { color: #6b7280; line-height: 1.6; }
    .emoji { font-size: 48px; }
    a { display: inline-block; margin-top: 24px; padding: 12px 32px; background: #1d4ed8; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
    a:hover { background: #1e40af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">&#127881;</div>
    <h1>Thank you for your purchase!</h1>
    <p>Check your email for the license key from Gumroad.<br>
    Enter it on CountryCompare to unlock all 50 Pro indicators.</p>
    <a href="/">Go to CountryCompare</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
