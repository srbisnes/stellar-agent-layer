"use client";

import { useEffect } from "react";
import { setCurrentUserId } from "@/lib/storage";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

function DemoScope({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setCurrentUserId("demo");
  }, []);
  return <>{children}</>;
}

function ClerkScope({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useUser } = require("@clerk/nextjs");
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    setCurrentUserId(user?.id ?? "demo");
  }, [user?.id, isLoaded]);

  return <>{children}</>;
}

/**
 * Binds the current user into the storage layer so engines are isolated per user.
 * Without Clerk keys we use a shared "demo" scope.
 */
export function UserScope({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled) return <DemoScope>{children}</DemoScope>;
  return <ClerkScope>{children}</ClerkScope>;
}
