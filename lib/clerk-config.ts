/**
 * Clerk is optional. When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing
 * the app runs in public demo mode (no login required).
 */
export function isClerkEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
  );
}

export function isOpenAIConfigured(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-")
  );
}
