import type { Request, RequestHandler } from "express";
import "express-session";
import { prisma } from "../db/client.js";
import { HttpError } from "../lib/errors.js";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    clerkId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      authClerkId?: string;
    }
  }
}

export const requireAuth: RequestHandler = async (request, _response, next) => {
  try {
    const clerkId = (request.headers["x-clerk-user-id"] as string | undefined)?.trim();

    // 1. If Clerk user ID header is provided by the client:
    if (clerkId) {
      // Check if existing session already matches this EXACT clerkId
      if (request.session.userId && request.session.clerkId === clerkId) {
        request.authUserId = request.session.userId;
        request.authClerkId = clerkId;
        return next();
      }

      // Session was either empty or belonged to a different user:
      // Find or upsert user for THIS clerkId
      const email = (request.headers["x-clerk-user-email"] as string | undefined)?.trim() || null;
      const name = (request.headers["x-clerk-user-name"] as string | undefined)?.trim() || null;
      const avatarUrl = (request.headers["x-clerk-user-avatar"] as string | undefined)?.trim() || null;

      const user = await prisma.user.upsert({
        where: { clerkId },
        create: {
          clerkId,
          email,
          name,
          avatarUrl,
        },
        update: {
          email: email ?? undefined,
          name: name ?? undefined,
          avatarUrl: avatarUrl ?? undefined,
        },
      });

      // Bind session strictly to this user and clerkId
      request.session.userId = user.id;
      request.session.clerkId = clerkId;
      request.authUserId = user.id;
      request.authClerkId = clerkId;
      return next();
    }

    // 2. If no Clerk user ID header was provided:
    // Only allow session if it has a valid clerkId bound and exists in DB
    if (request.session.userId && request.session.clerkId) {
      const user = await prisma.user.findUnique({
        where: { id: request.session.userId },
        select: { id: true, clerkId: true },
      });
      if (user && user.clerkId === request.session.clerkId) {
        request.authUserId = user.id;
        request.authClerkId = user.clerkId;
        return next();
      }
    }

    // Clear stale / mismatched session
    request.session.userId = undefined;
    request.session.clerkId = undefined;
    return next(new HttpError(401, "Authentication required"));
  } catch (error) {
    return next(error);
  }
};

export function authenticatedUserId(request: Request): string {
  if (!request.authUserId) {
    throw new HttpError(401, "Authentication required");
  }
  return request.authUserId;
}
