/**
 * User-scoped localStorage helpers.
 * Each Clerk user gets isolated wallet / contacts / payments data.
 */

let currentUserId: string | null = null;

export function setCurrentUserId(userId: string | null) {
  currentUserId = userId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function scopedKey(base: string): string {
  if (!currentUserId) return base;
  return `${base}:${currentUserId}`;
}

export function storageGet<T>(base: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(scopedKey(base));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet(base: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(scopedKey(base), JSON.stringify(value));
  } catch {
    // ignore quota errors in demo
  }
}

export function storageRemove(base: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(scopedKey(base));
}
