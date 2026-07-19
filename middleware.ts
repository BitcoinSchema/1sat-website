import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// txid (64 hex chars) optionally followed by _vout
const outpointSegment = /^\/outpoint\/([0-9a-fA-F]{64}(?:_\d{1,6})?)\/?$/;

export function middleware(request: NextRequest) {
  // Redirect bare /outpoint/<outpoint> to its timeline tab at the edge so it
  // never invokes a serverless function
  const match = request.nextUrl.pathname.match(outpointSegment);
  if (match) {
    const url = request.nextUrl.clone();
    url.pathname = `/outpoint/${match[1]}/timeline`;
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();

  response.headers.set(
    'Content-Security-Policy',
    "frame-src 'self' https://ordfs.network; frame-ancestors 'self';"
  );

  return response;
}

export const config = {
  matcher: '/:path*',
};
