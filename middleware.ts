import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEV_PREFIXES = ['/dev/', '/api/dev/'];

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const path = request.nextUrl.pathname;
    if (DEV_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dev/:path*', '/api/dev/:path*'],
};
