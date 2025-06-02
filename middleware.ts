import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { User } from '@/lib/types/user';

const publicRoutes = ['/login', '/api/server/user/signin'];

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('user');

  if (!userCookie && !publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (userCookie) {
    try {
      const userData = JSON.parse(userCookie.value) as User;

      if (!userData.token || !userData.expires) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const expiryTime = Math.floor(
        new Date(Number(userData.expires) * 1000).getTime() / 1000
      );
      const currentTime = Math.floor(Date.now() / 1000);

      if (currentTime >= expiryTime) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('user');
        return response;
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
