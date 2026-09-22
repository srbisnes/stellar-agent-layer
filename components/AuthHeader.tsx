"use client";

import { Button } from "./ui/button";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

function DemoBadge() {
  return (
    <span className="text-xs text-amber-400/80 border border-amber-500/20 rounded-full px-2.5 py-1">
      Demo
    </span>
  );
}

function ClerkAuthHeader() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {
    SignInButton,
    SignUpButton,
    UserButton,
    useUser,
  } = require("@clerk/nextjs");

  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="h-8 w-20 rounded-lg bg-gray-800 animate-pulse" />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">Sign up with Google</Button>
        </SignUpButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:block text-xs text-gray-400 max-w-[140px] truncate">
        {user?.primaryEmailAddress?.emailAddress || user?.fullName}
      </span>
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
      />
    </div>
  );
}

export function AuthHeader() {
  if (!clerkEnabled) return <DemoBadge />;
  return <ClerkAuthHeader />;
}
