import { z } from "zod";

export const idSchema = z.string().trim().min(1).max(200);

export const projectInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    species: z.string().trim().min(1).max(200),
    speciesTaxonomyId: z.string().trim().min(1).max(100),
    scope: z.string().trim().min(1).max(500),
    objective: z.string().trim().min(1).max(10_000),
  })
  .strict();

export const runRequestSchema = z
  .object({
    projectId: idSchema,
    species: z.string().trim().min(1).max(200),
    research_objective: z.string().trim().min(1).max(10_000),
    candidate_genes: z.array(z.string().trim().min(1).max(100)).max(1_000),
    constraints: z
      .object({
        max_edits: z.number().int().min(0).max(100_000),
        preserve_fertility: z.boolean(),
        maximize_diversity: z.boolean(),
      })
      .strict(),
    presets: z.array(z.enum(["minimal", "redundant"])).max(2),
  })
  .strict();

export const coreVerifyResponseSchema = z.object({
  status: z.string(),
  core_version: z.string(),
  instance_type: z.string(),
  identity: z.object({
    user_or_org: z.string(),
    scopes: z.array(z.string()),
  }),
});

export const speciesSearchResponseSchema = z.array(z.object({
  name: z.string(),
  taxonomy_id: z.string(),
}).passthrough());

export const geneSearchResponseSchema = z.array(z.object({
  symbol: z.string(),
  name: z.string(),
}).passthrough());

export const startRunResponseSchema = z.object({ run_id: z.string().min(1) }).passthrough();

const confidenceSchema = z.enum(["evidence", "model_estimated", "unknown"]);
const graphNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  rationale: z.string().optional(),
  confidence: confidenceSchema.optional(),
}).passthrough();
const graphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string(),
  confidence: confidenceSchema,
  weight: z.number(),
  rationale: z.string().optional(),
}).passthrough();
const strategySchema = z.object({
  id: z.string(),
  included: z.array(z.string()),
  excluded: z.array(z.string()),
  risk_score: z.number(),
  rationale: z.string(),
  stages: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

export const runResultSchema = z.object({
  run_id: z.string().min(1),
  status: z.enum(["queued", "running", "complete", "failed"]),
  objective: z.string().optional(),
  created_at: z.string().optional(),
  duration_ms: z.number().int().optional(),
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
  strategies: z.array(strategySchema),
}).passthrough();

export function normalizeCoreBaseUrl(input: string): string {
  const parsed = new URL(input);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Core URL must use HTTP or HTTPS");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Core URL must not include credentials, a query, or a fragment");
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  return parsed.toString().replace(/\/$/, "");
}

export function normalizePostgresUrl(input: string): string {
  const parsed = new URL(input);
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("Database URL must use postgres:// or postgresql://");
  }
  if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
    throw new Error("Database URL must include a host and database name");
  }
  return parsed.toString();
}
