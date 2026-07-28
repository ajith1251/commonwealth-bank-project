/**
 * Application configuration.
 *
 * Values are sourced from Vite environment variables (import.meta.env).
 * In development, Vite automatically loads .env files.
 *
 * For local development:
 *   VITE_API_ROOT=           (empty — uses Vite proxy to localhost:5203)
 *   VITE_USER_ID=62a29c15f4605c4c9fa7f306   (default seed user)
 */

function getEnv(key: string, fallback: string): string {
  const val = (import.meta as Record<string, any>).env?.[key]
  return (val as string | undefined) ?? fallback
}

export const config = {
  /** API base URL. Empty string means same-origin (Vite proxy handles /api -> backend). */
  apiRoot: getEnv('VITE_API_ROOT', ''),

  /** Default user ID for demo/single-user mode. Matches the seed data user "Tag Ramotar". */
  userId: getEnv('VITE_USER_ID', '62a29c15f4605c4c9fa7f306'),
} as const
