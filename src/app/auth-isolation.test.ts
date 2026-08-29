import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import 'express-session';
import { requireAuth, authenticatedUserId } from '../../server/src/auth/middleware';
import { prisma } from '../../server/src/db/client';

describe('Multi-tenant Authentication Isolation Middleware', () => {
  it('authenticates user A when x-clerk-user-id is user_A', async () => {
    const userA = { id: 'uuid-user-a', clerkId: 'clerk_user_A', email: 'a@example.com' };
    vi.spyOn(prisma.user, 'upsert').mockResolvedValue(userA as any);

    const req = {
      headers: { 'x-clerk-user-id': 'clerk_user_A' },
      session: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.session.userId).toBe('uuid-user-a');
    expect(req.session.clerkId).toBe('clerk_user_A');
    expect(authenticatedUserId(req)).toBe('uuid-user-a');
  });

  it('prevents session leakage when user B sends request with stale user A session cookie', async () => {
    const userB = { id: 'uuid-user-b', clerkId: 'clerk_user_B', email: 'b@example.com' };
    vi.spyOn(prisma.user, 'upsert').mockResolvedValue(userB as any);

    // Stale session cookie has user A's ID
    const req = {
      headers: { 'x-clerk-user-id': 'clerk_user_B' },
      session: {
        userId: 'uuid-user-a',
        clerkId: 'clerk_user_A',
      },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    // MUST be updated to User B, NOT User A!
    expect(req.session.userId).toBe('uuid-user-b');
    expect(req.session.clerkId).toBe('clerk_user_B');
    expect(authenticatedUserId(req)).toBe('uuid-user-b');
  });

  it('rejects requests without x-clerk-user-id or valid session', async () => {
    const req = {
      headers: {},
      session: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.status).toBe(401);
  });

  it('reuses existing session when clerkId strictly matches', async () => {
    const upsertSpy = vi.spyOn(prisma.user, 'upsert');
    upsertSpy.mockClear();

    const req = {
      headers: { 'x-clerk-user-id': 'clerk_user_A' },
      session: {
        userId: 'uuid-user-a',
        clerkId: 'clerk_user_A',
      },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(upsertSpy).not.toHaveBeenCalled();
    expect(authenticatedUserId(req)).toBe('uuid-user-a');
  });
});
