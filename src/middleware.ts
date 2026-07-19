import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// txid (64 hex chars) optionally followed by _vout
const outpointSegment = /^\/outpoint\/([0-9a-fA-F]{64}(?:_\d{1,6})?)\/?$/;

// Hosts search engines are allowed to crawl. Branch/preview deployments
// (alpha.*, *.vercel.app) serve the same content and burn serverless
// invocations on crawler traffic — Vercel only adds noindex to *.vercel.app
// URLs, not custom preview domains, so we handle it here.
const productionHosts = new Set(['1sat.market', 'www.1sat.market']);

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isProduction = productionHosts.has(host);

  // Serve a disallow-all robots.txt on non-production hosts; production
  // falls through to the static robots.txt route
  if (!isProduction && request.nextUrl.pathname === '/robots.txt') {
    return new NextResponse('User-Agent: *\nDisallow: /\n', {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

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

  if (!isProduction) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: '/:path*',
};
