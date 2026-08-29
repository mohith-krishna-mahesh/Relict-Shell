import { once } from "node:events";
import { Prisma, RunStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticatedUserId, requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/client.js";
import { coreCredentialsForUser, coreError, coreFetch } from "../lib/core-client.js";
import { HttpError } from "../lib/errors.js";
import { persistCoreRunResult, startRunWatcher } from "../lib/run-watcher.js";
import {
  geneSearchResponseSchema,
  idSchema,
  runRequestSchema,
  runResultSchema,
  speciesSearchResponseSchema,
  startRunResponseSchema,
} from "../lib/validation.js";

const speciesQuerySchema = z.object({ q: z.string().trim().min(1).max(200) });
const genesQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  species: z.string().trim().min(1).max(200),
});
const runParamsSchema = z.object({ runId: idSchema });

function inputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function ownedRun(userId: string, identifier: string) {
  const run = await prisma.run.findFirst({
    where: {
      project: { userId },
      OR: [{ id: identifier }, { coreRunId: identifier }],
    },
  });
  if (!run) throw new HttpError(404, "Run not found");
  return run;
}

async function proxyJsonGet(userId: string, path: string): Promise<unknown> {
  const response = await coreFetch(await coreCredentialsForUser(userId), path);
  if (!response.ok) throw await coreError(response);
  return response.json();
}

export const coreRouter = Router();
coreRouter.use(requireAuth);

coreRouter.get(["/search/species", "/species"], async (request, response) => {
  const { q } = speciesQuerySchema.parse(request.query);
  const data = await proxyJsonGet(authenticatedUserId(request), `/v1/search/species?q=${encodeURIComponent(q)}`);
  const parsed = speciesSearchResponseSchema.safeParse(data);
  if (!parsed.success) throw new HttpError(502, "Relict Core returned an invalid species response");
  response.json(parsed.data);
});

coreRouter.get(["/search/genes", "/genes"], async (request, response) => {
  const { q, species } = genesQuerySchema.parse(request.query);
  const query = new URLSearchParams({ q, species });
  const data = await proxyJsonGet(authenticatedUserId(request), `/v1/search/genes?${query.toString()}`);
  const parsed = geneSearchResponseSchema.safeParse(data);
  if (!parsed.success) throw new HttpError(502, "Relict Core returned an invalid gene response");
  response.json(parsed.data);
});

coreRouter.post("/runs", async (request, response) => {
  const userId = authenticatedUserId(request);
  const { projectId, ...runRequest } = runRequestSchema.parse(request.body);
  const project = await prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!project) throw new HttpError(404, "Project not found");

  const run = await prisma.run.create({
    data: { projectId, status: RunStatus.PENDING, request: inputJson(runRequest) },
  });
  try {
    const coreResponse = await coreFetch(await coreCredentialsForUser(userId), "/v1/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(runRequest),
    });
    if (!coreResponse.ok) throw await coreError(coreResponse);
    const payload: unknown = await coreResponse.json();
    const parsed = startRunResponseSchema.safeParse(payload);
    if (!parsed.success) throw new HttpError(502, "Relict Core returned an invalid run response", parsed.error.issues);
    await prisma.run.update({
      where: { id: run.id },
      data: { coreRunId: parsed.data.run_id, status: RunStatus.QUEUED, error: null },
    });
    startRunWatcher(run.id, parsed.data.run_id, userId);
    response.status(coreResponse.status).json({
      ...parsed.data,
      id: run.id,
      localRunId: run.id,
      coreRunId: parsed.data.run_id,
    });
  } catch (error) {
    await prisma.run.update({
      where: { id: run.id },
      data: { status: RunStatus.FAILED, error: error instanceof Error ? error.message : "Could not start Core run", completedAt: new Date() },
    });
    throw error;
  }
});

coreRouter.get(["/runs/:runId", "/runs/:runId/result"], async (request, response) => {
  const userId = authenticatedUserId(request);
  const { runId } = runParamsSchema.parse(request.params);
  const run = await ownedRun(userId, runId);
  if (!run.coreRunId) {
    if (run.result) return response.json(run.result);
    throw new HttpError(409, "Run has not been accepted by Relict Core");
  }

  try {
    const result = await persistCoreRunResult(run.id, run.coreRunId, userId);
    const parsed = runResultSchema.safeParse(result);
    if (!parsed.success) throw new HttpError(502, "Relict Core returned an invalid run result");
    response.json(result);
  } catch (error) {
    const persisted = run.result ?? (await prisma.run.findUnique({
      where: { id: run.id },
      select: { result: true },
    }))?.result;
    if (persisted) {
      response.setHeader("X-Relict-Result-Source", "persisted");
      response.json(persisted);
      return;
    }
    throw error;
  }
});

coreRouter.get("/runs/:runId/stream", async (request, response) => {
  const userId = authenticatedUserId(request);
  const { runId } = runParamsSchema.parse(request.params);
  const run = await ownedRun(userId, runId);
  if (!run.coreRunId) throw new HttpError(409, "Run has not been accepted by Relict Core");

  const abortController = new AbortController();
  response.on("close", () => abortController.abort());
  const upstream = await coreFetch(
    await coreCredentialsForUser(userId),
    `/v1/runs/${encodeURIComponent(run.coreRunId)}/stream`,
    { headers: { Accept: "text/event-stream" }, signal: abortController.signal },
    null,
  );
  if (!upstream.ok) throw await coreError(upstream);
  if (!upstream.body) throw new HttpError(502, "Relict Core returned an empty SSE stream");

  response.status(upstream.status);
  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.flushHeaders();

  const reader = upstream.body.getReader();
  try {
    while (!abortController.signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!response.write(Buffer.from(value))) await once(response, "drain");
    }
  } catch (error) {
    if (!abortController.signal.aborted) throw error;
  } finally {
    reader.releaseLock();
    if (!response.writableEnded) response.end();
  }
});
