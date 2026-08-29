import type { Request, Response, NextFunction } from "express";
import { HttpError } from "./errors.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = "Too many requests, please try again later.",
    keyGenerator = (req) => req.ip || req.socket.remoteAddress || "anonymous",
  } = options;

  const hits = new Map<string, ClientRecord>();

  // Periodically clean up expired records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    let record = hits.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetSeconds);

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      throw new HttpError(429, message);
    }

    next();
  };
}
