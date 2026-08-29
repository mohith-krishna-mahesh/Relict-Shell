import express from "express";
import session from "express-session";
import helmet from "helmet";
import { config } from "./config.js";
import { PrismaSessionStore } from "./db/session-store.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { rateLimiter } from "./lib/rate-limiter.js";
import { authRouter } from "./routes/auth.js";
import { coreRouter } from "./routes/core.js";
import { projectsRouter } from "./routes/projects.js";
import { settingsRouter } from "./routes/settings.js";
import { speciesRouter } from "./routes/species.js";

export function createApp() {
  const app = express();
  if (config.isProduction) app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // Production-grade security headers via Helmet
  app.use(
    helmet({
      frameguard: { action: "deny" }, // Anti-clickjacking
      noSniff: true, // Prevent MIME type sniffing
      xssFilter: true, // XSS filter protection
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      crossOriginResourcePolicy: { policy: "same-site" },
      hsts: config.isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Needed for inline theme script and Vite dev
            "https://*.clerk.accounts.dev",
            "https://clerk.relict.app",
            "https://challenges.cloudflare.com",
          ],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: [
            "'self'",
            "https://*.clerk.accounts.dev",
            "https://clerk.relict.app",
            "https://api.clerk.com",
            "https://*.neon.tech",
          ],
          frameSrc: ["'self'", "https://challenges.cloudflare.com", "https://*.clerk.accounts.dev"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
    })
  );

  // Body parser with strict size limit to prevent payload flooding
  app.use(express.json({ limit: "1mb", type: "application/json" }));

  // Global rate limiter on all API endpoints (300 requests per minute)
  app.use(
    "/api/",
    rateLimiter({
      windowMs: 60 * 1000,
      max: 300,
      message: "API request rate limit exceeded. Please slow down.",
    })
  );

  // Session configuration with secure, httpOnly cookies
  app.use(
    session({
      name: "relict.sid",
      secret: config.sessionSecret,
      store: new PrismaSessionStore(),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: "lax",
        maxAge: config.sessionMaxAgeMs,
      },
    })
  );

  // Health check endpoint
  app.get("/api/health", (_request, response) => response.json({ ok: true }));

  // Protected and public API routes
  app.use(
    "/api/auth",
    rateLimiter({
      windowMs: 60 * 1000,
      max: 60,
      message: "Auth rate limit exceeded. Please wait a moment.",
    }),
    authRouter
  );
  app.use("/api/settings", settingsRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/species", speciesRouter);
  app.use("/api/core/v1", coreRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
