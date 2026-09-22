import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

export default async function middleware(request: NextRequest) {
  // Public demo mode — no auth
  if (!clerkEnabled) {
    return NextResponse.next();
  }

  // Clerk configured: use official middleware
  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/friendbot(.*)",
    "/api/telegram(.*)",
    "/api/whatsapp(.*)",
    "/api/agent(.*)",
    "/api/payment(.*)",
  ]);

  return clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  })(request, {} as any);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
