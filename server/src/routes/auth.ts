import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";

const syncUserSchema = z.object({
  clerkId: z.string().min(1),
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

function regenerateSession(request: Express.Request): Promise<void> {
  return new Promise((resolve, reject) => request.session.regenerate((error) => (error ? reject(error) : resolve())));
}

function saveSession(request: Express.Request): Promise<void> {
  return new Promise((resolve, reject) => request.session.save((error) => (error ? reject(error) : resolve())));
}

export const authRouter = Router();

authRouter.get("/me", async (request, response) => {
  const clerkId = (request.headers["x-clerk-user-id"] as string | undefined)?.trim();

  let userId: string | undefined;

  if (clerkId) {
    // If Clerk ID is sent, verify that session matches this exact clerkId
    if (request.session.userId && request.session.clerkId === clerkId) {
      userId = request.session.userId;
    } else {
      // Re-sync session to this clerkId
      const email = (request.headers["x-clerk-user-email"] as string | undefined)?.trim() || null;
      const name = (request.headers["x-clerk-user-name"] as string | undefined)?.trim() || null;
      const avatarUrl = (request.headers["x-clerk-user-avatar"] as string | undefined)?.trim() || null;

      const user = await prisma.user.upsert({
        where: { clerkId },
        create: { clerkId, email, name, avatarUrl },
        update: { email: email ?? undefined, name: name ?? undefined, avatarUrl: avatarUrl ?? undefined },
      });
      request.session.userId = user.id;
      request.session.clerkId = clerkId;
      userId = user.id;
    }
  } else if (request.session.userId && request.session.clerkId) {
    userId = request.session.userId;
  }

  if (!userId) {
    request.session.userId = undefined;
    request.session.clerkId = undefined;
    response.json({ authenticated: false, user: null, hasCoreConnection: false });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { coreConnection: { select: { id: true } } },
  });

  if (!user) {
    request.session.userId = undefined;
    request.session.clerkId = undefined;
    response.json({ authenticated: false, user: null, hasCoreConnection: false });
    return;
  }

  response.json({
    authenticated: true,
    user: {
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    hasCoreConnection: Boolean(user.coreConnection),
  });
});

authRouter.post("/sync", async (request, response) => {
  const data = syncUserSchema.parse(request.body);

  const user = await prisma.user.upsert({
    where: { clerkId: data.clerkId },
    create: {
      clerkId: data.clerkId,
      name: data.name ?? null,
      email: data.email ?? null,
      avatarUrl: data.avatarUrl ?? null,
    },
    update: {
      name: data.name ?? undefined,
      email: data.email ?? undefined,
      avatarUrl: data.avatarUrl ?? undefined,
    },
    include: { coreConnection: { select: { id: true } } },
  });

  await regenerateSession(request);
  request.session.userId = user.id;
  request.session.clerkId = user.clerkId;
  await saveSession(request);

  response.json({
    authenticated: true,
    user: {
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    hasCoreConnection: Boolean(user.coreConnection),
  });
});

authRouter.post("/logout", (request, response, next) => {
  request.session.destroy((error) => {
    if (error) return next(error);
    response.clearCookie("relict.sid", { path: "/" });
    response.json({ ok: true });
  });
});
