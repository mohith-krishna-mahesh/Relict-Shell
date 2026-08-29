import { Router } from "express";
import { z } from "zod";
import { authenticatedUserId, requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/client.js";
import { HttpError } from "../lib/errors.js";
import { idSchema, projectInputSchema } from "../lib/validation.js";

const projectParamsSchema = z.object({ id: idSchema });
const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

function serializeRun(run: {
  id: string;
  coreRunId: string | null;
  status: string;
  request: unknown;
  result: unknown;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const request = typeof run.request === "object" && run.request !== null
    ? run.request as Record<string, unknown>
    : {};
  return {
    id: run.id,
    coreRunId: run.coreRunId ?? run.id,
    status: run.status.toLowerCase(),
    objective: typeof request.research_objective === "string" ? request.research_objective : "",
    request: run.request,
    result: run.result,
    error: run.error,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

projectsRouter.get("/", async (request, response) => {
  const projects = await prisma.project.findMany({
    where: { userId: authenticatedUserId(request) },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });
  response.json(projects);
});

projectsRouter.post("/", async (request, response) => {
  const input = projectInputSchema.parse(request.body);
  const project = await prisma.project.create({
    data: { ...input, userId: authenticatedUserId(request) },
  });
  response.status(201).json({ ...project, _count: { runs: 0 } });
});

projectsRouter.get("/:id/runs/latest", async (request, response) => {
  const { id } = projectParamsSchema.parse(request.params);
  const userId = authenticatedUserId(request);
  const project = await prisma.project.findFirst({ where: { id, userId }, select: { id: true } });
  if (!project) throw new HttpError(404, "Project not found");
  const run = await prisma.run.findFirst({ where: { projectId: id }, orderBy: { createdAt: "desc" } });
  response.json(run ? serializeRun(run) : null);
});

projectsRouter.get("/:id/runs", async (request, response) => {
  const { id } = projectParamsSchema.parse(request.params);
  const { limit } = historyQuerySchema.parse(request.query);
  const userId = authenticatedUserId(request);
  const project = await prisma.project.findFirst({ where: { id, userId }, select: { id: true } });
  if (!project) throw new HttpError(404, "Project not found");
  const runs = await prisma.run.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  response.json(runs.map(serializeRun));
});

projectsRouter.get("/:id", async (request, response) => {
  const { id } = projectParamsSchema.parse(request.params);
  const project = await prisma.project.findFirst({
    where: { id, userId: authenticatedUserId(request) },
    include: {
      _count: { select: { runs: true } },
      runs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");
  const { _count, runs, ...data } = project;
  response.json({
    ...data,
    _count,
    latestRun: runs[0] ? serializeRun(runs[0]) : null,
  });
});

projectsRouter.delete("/:id", async (request, response) => {
  const { id } = projectParamsSchema.parse(request.params);
  const userId = authenticatedUserId(request);
  const project = await prisma.project.findFirst({ where: { id, userId }, select: { id: true } });
  if (!project) throw new HttpError(404, "Project not found");
  await prisma.project.delete({ where: { id } });
  response.status(204).end();
});

