import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { generalRatelimit } from '@/lib/ratelimit'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Rate Limiting Check
  // Never rate-limit authentication endpoints, login, registration, or session validation
  const isAuthRoute = 
    pathname.startsWith('/api/auth') || 
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') || 
    pathname.startsWith('/auth') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  if (!isAuthRoute && pathname.startsWith('/api')) {
    try {
      // Identify user by real client IP (handles Cloudflare, Vercel, carrier CGNAT, and local proxies)
      const ip = 
        request.headers.get('cf-connecting-ip') || 
        request.headers.get('x-real-ip') || 
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
        (request as any).ip || 
        '127.0.0.1';

      const { success, limit, reset, remaining } = await generalRatelimit.limit(ip);
      
      if (!success) {
        return new NextResponse('Too many requests, slow down!', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        });
      }
    } catch (err) {
      // Fail-open: Never block user requests if Redis or rate-limiter encounters latency/errors
      console.warn("Rate-limiter fail-open bypass:", err);
    }
  }

  // 2. Original Supabase Session Update
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
