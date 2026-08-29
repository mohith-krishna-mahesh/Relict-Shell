import type { Prisma } from "@prisma/client";
import { RunStatus } from "@prisma/client";
import { prisma } from "../db/client.js";
import { coreCredentialsForUser, coreError, coreFetch } from "./core-client.js";
import { HttpError } from "./errors.js";

const activeWatchers = new Map<string, Promise<void>>();

export function isRunWatcherActive(localRunId: string): boolean {
  return activeWatchers.has(localRunId);
}

export async function fetchRunStream(userId: string, coreRunId: string): Promise<ReadableStream<Uint8Array>> {
  const response = await coreFetch(
    await coreCredentialsForUser(userId),
    `/v1/runs/${encodeURIComponent(coreRunId)}/stream`,
    { headers: { Accept: "text/event-stream" } },
    null,
  );
  if (!response.ok) throw await coreError(response);
  if (!response.body) throw new HttpError(502, "Relict Core returned an empty stream response");
  return response.body;
}

export async function persistCoreRunResult(
  localRunId: string,
  coreRunId: string,
  userId: string,
): Promise<unknown> {
  const credentials = await coreCredentialsForUser(userId);
  const response = await coreFetch(credentials, `/v1/runs/${encodeURIComponent(coreRunId)}`);
  if (!response.ok) throw await coreError(response);

  const payload: unknown = await response.json();
  const rec = typeof payload === "object" && payload !== null ? payload : {};
  const statusStr = "status" in rec && typeof rec.status === "string" ? rec.status.toUpperCase() : null;

  let newStatus: RunStatus | undefined;
  if (statusStr === "COMPLETE" || statusStr === "COMPLETED" || statusStr === "SUCCEEDED") {
    newStatus = RunStatus.COMPLETE;
  } else if (statusStr === "FAILED" || statusStr === "ERROR") {
    newStatus = RunStatus.FAILED;
  } else if (statusStr === "RUNNING" || statusStr === "EXECUTING") {
    newStatus = RunStatus.RUNNING;
  } else if (statusStr === "QUEUED" || statusStr === "PENDING") {
    newStatus = RunStatus.QUEUED;
  }

  const data: Prisma.RunUpdateInput = {};
  if (newStatus) {
    data.status = newStatus;
    if (newStatus === RunStatus.COMPLETE || newStatus === RunStatus.FAILED) {
      data.completedAt = new Date();
    }
  }
  if ("result" in rec && rec.result !== undefined) {
    data.result = rec.result as Prisma.InputJsonValue;
  }
  if ("error" in rec && typeof rec.error === "string") {
    data.error = rec.error;
  }

  if (Object.keys(data).length > 0) {
    await prisma.run.update({
      where: { id: localRunId },
      data,
    });
  }

  return payload;
}

async function watch(
  localRunId: string,
  coreRunId: string,
  userId: string,
): Promise<void> {
  try {
    const stream = await fetchRunStream(userId, coreRunId);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;
        if (trimmed.startsWith("data:")) {
          const rawData = trimmed.slice(5).trim();
          if (!rawData || rawData === "[DONE]") continue;
          try {
            await persistCoreRunResult(localRunId, coreRunId, userId);
          } catch {
            // Ignore temporary poll failures inside stream loop
          }
        }
      }
    }
  } catch (error) {
    console.error(`Run watcher for run ${localRunId} stream ended`, error);
  }
}

export function startRunWatcher(
  localRunId: string,
  coreRunId: string,
  userId: string,
): void {
  if (activeWatchers.has(localRunId)) return;
  const watcher = watch(localRunId, coreRunId, userId)
    .catch((error) => console.error(`Run watcher ${localRunId} stopped unexpectedly`, error))
    .finally(() => activeWatchers.delete(localRunId));
  activeWatchers.set(localRunId, watcher);
}

export async function resumeRunWatchers(): Promise<void> {
  try {
    const runs = await prisma.run.findMany({
      where: {
        coreRunId: { not: null },
        status: { in: [RunStatus.PENDING, RunStatus.QUEUED, RunStatus.RUNNING] },
      },
      select: { id: true, coreRunId: true, project: { select: { userId: true } } },
    });
    for (const run of runs) {
      if (run.coreRunId) startRunWatcher(run.id, run.coreRunId, run.project.userId);
    }
  } catch (error) {
    console.warn("[Database] Could not connect to PostgreSQL at DATABASE_URL. Run watchers skipped until database is available.");
  }
}
