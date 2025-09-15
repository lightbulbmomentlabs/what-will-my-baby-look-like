import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that require authentication
const isProtectedPageRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/gallery(.*)',
]);

// Define API routes that require auth but should return JSON errors
const isProtectedApiRoute = createRouteMatcher([
  '/api/generate-baby',
  '/api/create-checkout-session',
]);

// Define API routes that don't need auth (like webhooks)
const isPublicApiRoute = createRouteMatcher([
  '/api/webhooks(.*)',
  '/api/health',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public API routes
  if (isPublicApiRoute(req)) {
    return;
  }

  // Handle protected API routes - return JSON error instead of redirect
  if (isProtectedApiRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to generate baby images.',
        requiresAuth: true,
      }, { status: 401 });
    }
    return;
  }

  // Handle protected page routes - check auth without forcing redirect
  if (isProtectedPageRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // Only redirect if user is truly not authenticated
      // Use the current domain for sign-in URL to avoid subdomain issues
      const signInUrl = new URL('/sign-in', req.url);

      // Use just the pathname for redirect to avoid domain issues
      const redirectPath = req.nextUrl.pathname + req.nextUrl.search;
      signInUrl.searchParams.set('redirect_url', redirectPath);

      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};