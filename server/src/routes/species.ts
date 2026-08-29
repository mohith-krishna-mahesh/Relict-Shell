import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { rateLimiter } from "../lib/rate-limiter.js";

const speciesSearchQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  scope: z.string().trim().max(60).optional().default(""),
});

export const speciesRouter = Router();

// Rate limit species search to 120 requests per minute per IP
speciesRouter.use(
  rateLimiter({
    windowMs: 60 * 1000,
    max: 120,
    message: "Species search rate limit exceeded. Please wait a moment before searching again.",
  })
);

speciesRouter.get("/search", async (request, response, next) => {
  try {
    const { q, scope } = speciesSearchQuerySchema.parse(request.query);

    if (scope === "Precision Medicine") {
      return response.json([
        {
          id: "homo-sapiens",
          scientificName: "Homo sapiens",
          commonName: "Human",
          taxonomyId: 9606,
          isExtinct: false,
          hasGenomeData: true,
          tags: [],
        },
      ]);
    }

    if (q) {
      // Scope boost calculation
      let scopeBoost = "0";
      switch (scope) {
        case "Conservation":
          scopeBoost = "CASE WHEN 'endangered' = ANY(tags) THEN 1 ELSE 0 END";
          break;
        case "De-Extinction":
          scopeBoost = 'CASE WHEN "isExtinct" = true THEN 1 ELSE 0 END';
          break;
        case "Agriculture":
          scopeBoost = "CASE WHEN tags && ARRAY['crop', 'livestock']::text[] THEN 1 ELSE 0 END";
          break;
        case "Population Control":
          scopeBoost = "CASE WHEN tags && ARRAY['invasive', 'disease-vector']::text[] THEN 1 ELSE 0 END";
          break;
        case "Synthetic Biology":
          scopeBoost = "CASE WHEN 'chassis' = ANY(tags) THEN 1 ELSE 0 END";
          break;
      }

      const query = `
        SELECT id, "scientificName", "commonName", "taxonomyId", source, "isExtinct", "hasGenomeData", tags
        FROM "Species"
        WHERE (
          "scientificName" ILIKE '%' || $1 || '%'
          OR "commonName" ILIKE '%' || $1 || '%'
          OR LOWER($1) = ANY(tags)
          OR "scientificName" % $1
          OR "commonName" % $1
        )
        ORDER BY
          -- 1. Exact match / tag match priority
          CASE 
            WHEN LOWER("scientificName") = LOWER($1) OR LOWER(COALESCE("commonName", '')) = LOWER($1) THEN 0
            WHEN LOWER($1) = ANY(tags) THEN 1
            WHEN "commonName" ILIKE $1 || '%' OR "scientificName" ILIKE $1 || '%' THEN 2
            WHEN "commonName" ILIKE '% ' || $1 || '%' OR "scientificName" ILIKE '% ' || $1 || '%' THEN 3
            ELSE 4
          END ASC,
          -- 2. Scope relevance boost
          (${scopeBoost}) DESC,
          -- 3. Sequenced genome / well-characterized model organism boost
          CASE WHEN "hasGenomeData" = true THEN 1 ELSE 0 END DESC,
          -- 4. Trigram similarity score
          GREATEST(similarity("scientificName", $1), similarity(COALESCE("commonName", ''), $1)) DESC
        LIMIT 25
      `;
      const results = await prisma.$queryRawUnsafe(query, q);
      return response.json(results);
    } else {
      // Default suggestions when search input is empty but focused
      let scopeFilter = "1=1";
      switch (scope) {
        case "Conservation":
          scopeFilter = "'endangered' = ANY(tags)";
          break;
        case "De-Extinction":
          scopeFilter = '"isExtinct" = true';
          break;
        case "Agriculture":
          scopeFilter = "tags && ARRAY['crop', 'livestock']::text[]";
          break;
        case "Population Control":
          scopeFilter = "tags && ARRAY['invasive', 'disease-vector']::text[]";
          break;
        case "Synthetic Biology":
          scopeFilter = "'chassis' = ANY(tags)";
          break;
      }

      const query = `
        SELECT id, "scientificName", "commonName", "taxonomyId", source, "isExtinct", "hasGenomeData", tags
        FROM "Species"
        WHERE ${scopeFilter}
        ORDER BY 
          CASE WHEN "hasGenomeData" = true THEN 0 ELSE 1 END,
          "scientificName" ASC
        LIMIT 20
      `;
      const results = await prisma.$queryRawUnsafe(query);
      return response.json(results);
    }
  } catch (error) {
    next(error);
  }
});
