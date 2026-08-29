import "express-session";

export {};

declare module "express-session" {
  interface SessionData {
    userId?: string;
    clerkUserId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      clerkUserId?: string;
    }
  }
}
