"use client";

import { useEffect } from "react";
import { setCurrentUserId } from "@/lib/storage";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

/**
 * Binds the current Clerk userId into the storage layer
 * so every engine (wallet / contacts / payments) is isolated per user.
 * When Clerk is disabled we use a shared "demo" scope.
 */
export function UserScope({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!clerkEnabled) {
      setCurrentUserId("demo");
      return;
    }

    try {
      const { useUser } = require("@clerk/nextjs");
      // This component is a child of ClerkProvider only when enabled,
      // so the hook is safe. We still fall back to "demo".
      // Note: hooks cannot be called conditionally — so we keep a separate path.
    } catch {
      setCurrentUserId("demo");
    }
  }, []);

  // When Clerk is enabled we need the real hook. Use a small inner component.
  if (clerkEnabled) {
    return <ClerkUserScope>{children}</ClerkUserScope>;
  }

  return <>{children}</>;
}

function ClerkUserScope({ children }: { children: React.ReactNode }) {
  const { useUser } = require("@clerk/nextjs");
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    setCurrentUserId(user?.id ?? "demo");
  }, [user?.id, isLoaded]);

  return <>{children}</>;
}
