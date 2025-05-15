import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/api/chat'];

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('user');
  const { pathname } = request.nextUrl;

  if (!userCookie && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (userCookie) {
    try {
      const userData = JSON.parse(userCookie.value);

      if (!userData.token || !userData.expires) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const expiryTime = new Date(userData.expires).getTime();
      const currentTime = new Date().getTime();

      if (currentTime >= expiryTime) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('user');
        return response;
      }

      if (publicRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.error('Error parsing user cookie:', error);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('user');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
