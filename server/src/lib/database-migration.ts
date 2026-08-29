import { PrismaClient } from "@prisma/client";
import { HttpError } from "./errors.js";

const migrationStatements = [
  `CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'COMPLETE', 'FAILED')`,
  `CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "clerkId" TEXT NOT NULL UNIQUE, "name" TEXT, "email" TEXT, "avatarUrl" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL)`,
  `CREATE TABLE "CoreConnection" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL UNIQUE, "baseUrl" TEXT NOT NULL, "encryptedApiKey" TEXT NOT NULL, "coreVersion" TEXT, "instanceType" TEXT, "identity" TEXT, "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "verifiedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CoreConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE TABLE "DatabaseConnection" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL UNIQUE, "encryptedDatabaseUrl" TEXT NOT NULL, "migratedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "DatabaseConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE TABLE "Project" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "name" TEXT NOT NULL, "species" TEXT NOT NULL, "speciesTaxonomyId" TEXT NOT NULL, "scope" TEXT NOT NULL, "objective" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE TABLE "Run" ("id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL, "coreRunId" TEXT, "status" "RunStatus" NOT NULL DEFAULT 'PENDING', "request" JSONB NOT NULL, "result" JSONB, "error" TEXT, "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Run_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE TABLE "Session" ("id" TEXT PRIMARY KEY, "data" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL)`,
  `CREATE INDEX "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt")`,
  `CREATE UNIQUE INDEX "Run_projectId_coreRunId_key" ON "Run"("projectId", "coreRunId")`,
  `CREATE INDEX "Run_projectId_createdAt_idx" ON "Run"("projectId", "createdAt")`,
  `CREATE INDEX "Run_status_idx" ON "Run"("status")`,
  `CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt")`,
] as const;

function clientFor(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}

async function assertBare(client: PrismaClient): Promise<void> {
  const objects = await client.$queryRawUnsafe<Array<{ name: string }>>(`
    SELECT c.relname AS name
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = current_schema()
      AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
    UNION ALL
    SELECT t.typname AS name
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = current_schema() AND t.typtype = 'e'
    LIMIT 1
  `);
  if (objects.length) {
    throw new HttpError(409, "The target database schema is not bare; no migration was performed");
  }
}

export async function verifyBareDatabase(databaseUrl: string): Promise<void> {
  const client = clientFor(databaseUrl);
  try {
    await assertBare(client);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Could not connect to the PostgreSQL database");
  } finally {
    await client.$disconnect();
  }
}

export async function migrateBareDatabase(databaseUrl: string): Promise<void> {
  const client = clientFor(databaseUrl);
  try {
    await assertBare(client);
    await client.$transaction(async (transaction) => {
      for (const statement of migrationStatements) {
        await transaction.$executeRawUnsafe(statement);
      }
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "The bare database migration failed and was rolled back");
  } finally {
    await client.$disconnect();
  }
}
