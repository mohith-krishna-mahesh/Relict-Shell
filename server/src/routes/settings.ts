import { Router } from "express";
import { z } from "zod";
import { authenticatedUserId, requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/client.js";
import { coreCredentialsForUser, verifyCore } from "../lib/core-client.js";
import { encryptSecret } from "../lib/crypto.js";
import { migrateBareDatabase, verifyBareDatabase } from "../lib/database-migration.js";
import { HttpError } from "../lib/errors.js";
import { normalizeCoreBaseUrl, normalizePostgresUrl } from "../lib/validation.js";

const coreInputSchema = z.object({
  baseUrl: z.string().trim().min(1).max(2_000),
  apiKey: z.string().trim().min(1).max(10_000).optional(),
}).strict();
const optionalCoreInputSchema = coreInputSchema.partial();
const databaseInputSchema = z.object({
  databaseUrl: z.string().trim().min(1).max(10_000),
  confirmMigration: z.boolean().optional().default(false),
}).strict();

function validatedCoreUrl(value: string): string {
  try {
    return normalizeCoreBaseUrl(value);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : "Invalid Core URL");
  }
}

function validatedDatabaseUrl(value: string): string {
  try {
    return normalizePostgresUrl(value);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : "Invalid database URL");
  }
}

async function resolvedCoreCredentials(
  userId: string,
  input: { baseUrl?: string; apiKey?: string },
) {
  let stored: Awaited<ReturnType<typeof coreCredentialsForUser>> | null = null;
  if (!input.apiKey) {
    try {
      stored = await coreCredentialsForUser(userId);
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 409) throw error;
    }
  }
  if (!input.apiKey && !stored) {
    throw new HttpError(400, "An API key is required for the first Core connection");
  }
  return {
    baseUrl: validatedCoreUrl(input.baseUrl ?? stored!.baseUrl),
    apiKey: input.apiKey ?? stored!.apiKey,
  };
}

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get("/core", async (request, response) => {
  const connection = await prisma.coreConnection.findUnique({
    where: { userId: authenticatedUserId(request) },
    select: {
      baseUrl: true,
      coreVersion: true,
      instanceType: true,
      identity: true,
      scopes: true,
      verifiedAt: true,
    },
  });
  response.json({
    connected: Boolean(connection),
    baseUrl: connection?.baseUrl,
    apiKeyConfigured: Boolean(connection),
    version: connection?.coreVersion,
    core: connection,
  });
});

settingsRouter.post("/core/test", async (request, response) => {
  const userId = authenticatedUserId(request);
  const input = optionalCoreInputSchema.parse(request.body ?? {});
  const credentials = input.baseUrl || input.apiKey
    ? await resolvedCoreCredentials(userId, input)
    : await coreCredentialsForUser(userId);
  const verification = await verifyCore(credentials);
  response.json({ ok: true, verification });
});

settingsRouter.put("/core", async (request, response) => {
  const userId = authenticatedUserId(request);
  const input = coreInputSchema.parse(request.body);
  const credentials = await resolvedCoreCredentials(userId, input);
  const { baseUrl, apiKey } = credentials;
  const verification = await verifyCore(credentials);
  const connection = await prisma.coreConnection.upsert({
    where: { userId },
    create: {
      userId,
      baseUrl,
      encryptedApiKey: encryptSecret(apiKey),
      coreVersion: verification.core_version,
      instanceType: verification.instance_type,
      identity: verification.identity.user_or_org,
      scopes: verification.identity.scopes,
      verifiedAt: new Date(),
    },
    update: {
      baseUrl,
      encryptedApiKey: encryptSecret(apiKey),
      coreVersion: verification.core_version,
      instanceType: verification.instance_type,
      identity: verification.identity.user_or_org,
      scopes: verification.identity.scopes,
      verifiedAt: new Date(),
    },
    select: {
      baseUrl: true,
      coreVersion: true,
      instanceType: true,
      identity: true,
      scopes: true,
      verifiedAt: true,
    },
  });
  response.json({
    connected: true,
    baseUrl: connection.baseUrl,
    apiKeyConfigured: true,
    version: connection.coreVersion,
    core: connection,
  });
});

settingsRouter.put("/database", async (request, response) => {
  const userId = authenticatedUserId(request);
  const input = databaseInputSchema.parse(request.body);
  const databaseUrl = validatedDatabaseUrl(input.databaseUrl);

  if (!input.confirmMigration) {
    await verifyBareDatabase(databaseUrl);
    response.json({ ok: true, bare: true, requiresConfirmation: true });
    return;
  }

  await migrateBareDatabase(databaseUrl);
  await prisma.databaseConnection.upsert({
    where: { userId },
    create: { userId, encryptedDatabaseUrl: encryptSecret(databaseUrl), migratedAt: new Date() },
    update: { encryptedDatabaseUrl: encryptSecret(databaseUrl), migratedAt: new Date() },
  });
  response.json({ ok: true, bare: false, migrated: true });
});
