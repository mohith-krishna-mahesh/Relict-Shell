import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

function integerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  isProduction,
  port: integerEnv("PORT", 8787),
  sessionSecret:
    process.env.SESSION_SECRET ||
    "relict-shell-session-secret-fallback-minimum-32-chars",
  sessionMaxAgeMs: integerEnv("SESSION_MAX_AGE_MS", 7 * 24 * 60 * 60 * 1000),
  webAppUrl: process.env.WEB_ORIGIN ?? process.env.WEB_APP_URL ?? "http://localhost:5173",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY ?? "",
  coreCredentialsSecret: process.env.CORE_CREDENTIALS_SECRET || "relict-shell-core-secret-fallback-minimum-32-chars",
  coreTimeoutMs: integerEnv("CORE_REQUEST_TIMEOUT_MS", 30_000),
} as const;

export function assertStartupConfig(): void {
  if (!process.env.SESSION_SECRET) {
    console.warn("Notice: SESSION_SECRET is not set in environment; using secure fallback.");
  }
}
