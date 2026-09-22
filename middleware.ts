import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

// Public routes always allowed (APIs + auth pages)
const publicPaths = [
  "/sign-in",
  "/sign-up",
  "/api/friendbot",
  "/api/telegram",
  "/api/whatsapp",
  "/api/agent",
  "/api/payment",
];

export default async function middleware(request: NextRequest) {
  // No Clerk keys → fully public demo mode
  if (!clerkEnabled) {
    return NextResponse.next();
  }

  // Dynamic import so the build does not fail when Clerk env is absent
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

  // Re-use official clerkMiddleware for proper session handling
  const handler = clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  });

  // @ts-expect-error – clerkMiddleware signature matches Next middleware
  return handler(request, {} as any);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
