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
    process.env.SESSION_SECRET ??
    (isProduction ? "" : "development-only-change-this-session-secret"),
  sessionMaxAgeMs: integerEnv("SESSION_MAX_AGE_MS", 7 * 24 * 60 * 60 * 1000),
  webAppUrl: process.env.WEB_ORIGIN ?? process.env.WEB_APP_URL ?? "http://localhost:5173",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY ?? "",
  coreCredentialsSecret: process.env.CORE_CREDENTIALS_SECRET ?? "",
  coreTimeoutMs: integerEnv("CORE_REQUEST_TIMEOUT_MS", 30_000),
} as const;

export function assertStartupConfig(): void {
  if (!config.sessionSecret) {
    throw new Error("SESSION_SECRET is required in production");
  }
}
