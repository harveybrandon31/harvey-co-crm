import { randomBytes, createHash } from "crypto";

/**
 * Generate a secure random token for intake links
 * Format: 32 random hex characters
 */
export function generateIntakeToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Hash a token for secure storage comparison
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a secure intake link URL
 */
export function generateIntakeUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/intake/${token}`;
}

/**
 * Calculate expiration date (default 30 days from now)
 */
export function getExpirationDate(daysFromNow: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}
