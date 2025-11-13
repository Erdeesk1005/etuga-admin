// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(req) {
    const { nextUrl, cookies } = req;

    const token = cookies.get('at')?.value;
    const isDashboard = nextUrl.pathname.startsWith('/dashboard');

    if (isDashboard) {
        if (!token) {
            const loginUrl = new URL('/login', req.url);
            loginUrl.searchParams.set('from', nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }
    }
    if (nextUrl.pathname.startsWith('/login')) {
        if (token) {
            const url = req.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
    }
    return NextResponse.next();
}

// Зөвхөн /dashboard/** замд энэ middleware ажиллана
export const config = {
    // matcher: ['/dashboard/:path*', '/login'],
    // matcher: ['/login'],
};
