import session, { type SessionData } from "express-session";
import { prisma } from "./client.js";

function expiryFor(sessionData: SessionData): Date {
  const expires = sessionData.cookie?.expires;
  if (expires) return new Date(expires);
  const maxAge = sessionData.cookie?.maxAge ?? 24 * 60 * 60 * 1000;
  return new Date(Date.now() + maxAge);
}

export class PrismaSessionStore extends session.Store {
  override get(
    sid: string,
    callback: (error: unknown, session?: SessionData | null) => void,
  ): void {
    void prisma.session
      .findUnique({ where: { id: sid } })
      .then(async (record) => {
        if (!record) return callback(null, null);
        if (record.expiresAt <= new Date()) {
          await prisma.session.deleteMany({ where: { id: sid } });
          return callback(null, null);
        }
        callback(null, JSON.parse(record.data) as SessionData);
      })
      .catch(callback);
  }

  override set(sid: string, sessionData: SessionData, callback?: (error?: unknown) => void): void {
    const data = JSON.stringify(sessionData);
    const expiresAt = expiryFor(sessionData);
    void prisma.session
      .upsert({
        where: { id: sid },
        create: { id: sid, data, expiresAt },
        update: { data, expiresAt },
      })
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error));
  }

  override destroy(sid: string, callback?: (error?: unknown) => void): void {
    void prisma.session
      .deleteMany({ where: { id: sid } })
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error));
  }

  override touch(sid: string, sessionData: SessionData, callback?: (error?: unknown) => void): void {
    void prisma.session
      .updateMany({ where: { id: sid }, data: { expiresAt: expiryFor(sessionData) } })
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error));
  }
}
