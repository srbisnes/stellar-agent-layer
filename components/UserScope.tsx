"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { setCurrentUserId } from "@/lib/storage";

/**
 * Binds the current Clerk userId into the storage layer
 * so every engine (wallet / contacts / payments) is isolated per user.
 */
export function UserScope({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    setCurrentUserId(user?.id ?? null);
  }, [user?.id, isLoaded]);

  return <>{children}</>;
}
