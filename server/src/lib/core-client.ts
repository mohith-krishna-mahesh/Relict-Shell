import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db/client.js";
import { decryptSecret } from "./crypto.js";
import { HttpError } from "./errors.js";
import { coreVerifyResponseSchema, normalizeCoreBaseUrl } from "./validation.js";

export interface CoreCredentials {
  baseUrl: string;
  apiKey: string;
}

export async function coreCredentialsForUser(userId: string): Promise<CoreCredentials> {
  const connection = await prisma.coreConnection.findUnique({ where: { userId } });
  if (!connection) throw new HttpError(409, "Connect Relict Core before using this endpoint");
  return { baseUrl: connection.baseUrl, apiKey: decryptSecret(connection.encryptedApiKey) };
}

export async function coreFetch(
  credentials: CoreCredentials,
  path: string,
  init: RequestInit = {},
  timeoutMs: number | null = config.coreTimeoutMs,
): Promise<Response> {
  const baseUrl = normalizeCoreBaseUrl(credentials.baseUrl);
  if (!path.startsWith("/v1/")) throw new HttpError(500, "Invalid internal Core path");
  const target = new URL(`${baseUrl}${path}`);
  if (target.origin !== new URL(baseUrl).origin) {
    throw new HttpError(500, "Invalid internal Core target");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${credentials.apiKey}`);
  headers.set("Accept", headers.get("Accept") ?? "application/json");
  const timeoutSignal = timeoutMs === null ? undefined : AbortSignal.timeout(timeoutMs);
  const signal = init.signal && timeoutSignal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : init.signal ?? timeoutSignal;

  let response: Response;
  try {
    response = await fetch(target, { ...init, headers, signal, redirect: "manual" });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, "Relict Core is unreachable");
  }
  if (response.status >= 300 && response.status < 400) {
    throw new HttpError(502, "Relict Core redirects are not allowed");
  }
  return response;
}

export async function coreError(response: Response): Promise<HttpError> {
  const text = (await response.text()).slice(0, 1_000);
  return new HttpError(response.status === 401 || response.status === 403 ? 424 : 502, "Relict Core request failed", {
    upstreamStatus: response.status,
    upstreamBody: text || undefined,
  });
}

export async function verifyCore(credentials: CoreCredentials) {
  const response = await coreFetch(credentials, "/v1/auth/verify", { method: "POST" });
  if (!response.ok) throw await coreError(response);
  try {
    return coreVerifyResponseSchema.parse(await response.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpError(502, "Relict Core returned an invalid verification response", error.issues);
    }
    throw error;
  }
}
