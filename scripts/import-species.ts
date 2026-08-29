#!/usr/bin/env tsx
/**
 * Relict Shell — Unified Species Import (NCBI + GBIF Backbone + PBDB)
 *
 * High-performance streaming import using PostgreSQL COPY protocol.
 * Merges:
 *   1. GBIF Backbone Taxonomy (Taxon.tsv + VernacularName.tsv)
 *   2. NCBI Taxonomy (nodes.dmp + names.dmp)
 *   3. Paleobiology Database (pbdb_taxa.csv)
 *
 * Applies scope tags: endangered, crop, livestock, invasive, disease-vector, chassis
 * Flags sequenced organisms with hasGenomeData: true
 *
 * Usage: NODE_OPTIONS="--max-old-space-size=8192" pnpm tsx scripts/import-species.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import pkgPg from 'pg';
const { Client } = pkgPg;
import pkgPgCopy from 'pg-copy-streams';
const copyFrom = pkgPgCopy.from ?? (pkgPgCopy as any).default?.from;
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if not already set
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const DOWNLOADS = path.resolve(__dirname, '..', 'downloads');
const NCBI_NAMES = path.join(DOWNLOADS, 'ncbi', 'names.dmp');
const NCBI_NODES = path.join(DOWNLOADS, 'ncbi', 'nodes.dmp');
const PBDB_CSV = path.join(DOWNLOADS, 'pbdb', 'pbdb_taxa.csv');
const GBIF_TAXON = path.join(DOWNLOADS, 'gbif', 'backbone', 'Taxon.tsv');
const GBIF_VERNACULAR = path.join(DOWNLOADS, 'gbif', 'backbone', 'VernacularName.tsv');

// ─── Curated Scope Tag Sets ──────────────────────────────────────────────────

const TAG_LISTS: Record<string, Set<string>> = {
  endangered: new Set([
    'Panthera tigris', 'Ailuropoda melanoleuca', 'Gorilla beringei',
    'Diceros bicornis', 'Elephas maximus', 'Pongo pygmaeus',
    'Panthera leo', 'Balaenoptera musculus', 'Rhincodon typus',
    'Caretta caretta', 'Eretmochelys imbricata', 'Dermochelys coriacea',
    'Acinonyx jubatus', 'Panthera onca', 'Pteronura brasiliensis',
    'Eubalaena glacialis', 'Gopherus agassizii', 'Gymnogyps californianus',
    'Ambystoma mexicanum', 'Spheniscus galapagoensis', 'Iguana delicatissima',
    'Hippopotamus amphibius', 'Loxodonta africana', 'Gorilla gorilla',
    'Pongo abelii', 'Pongo tapanuliensis', 'Rhinoceros unicornis',
    'Rhinoceros sondaicus', 'Dicerorhinus sumatrensis', 'Panthera pardus',
    'Panthera uncia', 'Varecia variegata', 'Lemur catta',
    'Mammuthus primigenius', 'Thylacinus cynocephalus', 'Ectopistes migratorius',
    'Raphus cucullatus', 'Smilodon fatalis', 'Pinguinus impennis',
  ]),
  crop: new Set([
    'Oryza sativa', 'Zea mays', 'Triticum aestivum', 'Glycine max',
    'Solanum tuberosum', 'Saccharum officinarum', 'Ipomoea batatas',
    'Manihot esculenta', 'Solanum lycopersicum', 'Musa acuminata',
    'Musa balbisiana', 'Brassica oleracea', 'Allium cepa',
    'Malus domestica', 'Citrus sinensis', 'Vitis vinifera',
    'Arachis hypogaea', 'Gossypium hirsutum', 'Phaseolus vulgaris',
    'Coffea arabica', 'Theobroma cacao', 'Camellia sinensis',
    'Nicotiana tabacum', 'Helianthus annuus', 'Beta vulgaris',
    'Hordeum vulgare', 'Sorghum bicolor', 'Secale cereale',
    'Avena sativa', 'Brassica rapa', 'Capsicum annuum',
  ]),
  livestock: new Set([
    'Bos taurus', 'Bos indicus', 'Sus domesticus', 'Sus scrofa',
    'Ovis aries', 'Capra hircus', 'Capra aegagrus', 'Gallus gallus',
    'Meleagris gallopavo', 'Anas platyrhynchos', 'Anser anser',
    'Equus caballus', 'Equus asinus', 'Bubalus bubalis',
    'Camelus dromedarius', 'Camelus bactrianus', 'Lama glama',
    'Vicugna pacos', 'Cavia porcellus', 'Apis mellifera',
    'Bombyx mori', 'Salmo salar', 'Oncorhynchus mykiss',
  ]),
  invasive: new Set([
    'Rhinella marina', 'Lissachatina fulica', 'Achatina fulica',
    'Sturnus vulgaris', 'Vulpes vulpes', 'Felis catus',
    'Pueraria montana', 'Eichhornia crassipes', 'Lantana camara',
    'Reynoutria japonica', 'Fallopia japonica', 'Coptotermes formosanus',
    'Aedes albopictus', 'Dreissena polymorpha', 'Asterias amurensis',
    'Mnemiopsis leidyi', 'Cyprinus carpio', 'Lates niloticus',
    'Herpestes javanicus', 'Pycnonotus cafer', 'Trachemys scripta',
  ]),
  'disease-vector': new Set([
    'Aedes aegypti', 'Aedes albopictus', 'Anopheles gambiae',
    'Anopheles stephensi', 'Culex pipiens', 'Culex quinquefasciatus',
    'Ixodes scapularis', 'Ixodes ricinus', 'Phlebotomus papatasi',
    'Glossina morsitans', 'Triatoma infestans', 'Pediculus humanus',
    'Xenopsylla cheopis', 'Simulium damnosum', 'Biomphalaria glabrata',
  ]),
  chassis: new Set([
    'Escherichia coli', 'Saccharomyces cerevisiae', 'Bacillus subtilis',
    'Pseudomonas putida', 'Corynebacterium glutamicum',
    'Streptomyces coelicolor', 'Lactococcus lactis', 'Yarrowia lipolytica',
    'Pichia pastoris', 'Komagataella phaffii', 'Synechocystis sp.',
    'Aspergillus niger', 'Mycoplasma mycoides',
    'Clostridium autoethanogenum', 'Vibrio natriegens',
    'Rhodobacter sphaeroides', 'Schizosaccharomyces pombe',
    'Pichia kudriavzevii', 'Chlamydomonas reinhardtii',
  ]),
};

// Major organisms with high-quality reference genomes
const GENOME_SPECIES = new Set([
  'Homo sapiens', 'Mus musculus', 'Rattus norvegicus', 'Danio rerio',
  'Drosophila melanogaster', 'Caenorhabditis elegans', 'Arabidopsis thaliana',
  'Escherichia coli', 'Saccharomyces cerevisiae', 'Bacillus subtilis',
  'Oryza sativa', 'Zea mays', 'Triticum aestivum', 'Glycine max',
  'Solanum tuberosum', 'Solanum lycopersicum', 'Bos taurus', 'Sus scrofa',
  'Gallus gallus', 'Ovis aries', 'Equus caballus', 'Canis lupus familiaris',
  'Felis catus', 'Pan troglodytes', 'Gorilla gorilla', 'Macaca mulatta',
  'Xenopus tropicalis', 'Xenopus laevis', 'Anopheles gambiae',
  'Aedes aegypti', 'Plasmodium falciparum', 'Trypanosoma brucei',
  'Leishmania major', 'Mycobacterium tuberculosis', 'Staphylococcus aureus',
  'Pseudomonas aeruginosa', 'Nicotiana tabacum', 'Vitis vinifera',
  'Gossypium hirsutum', 'Hordeum vulgare', 'Sorghum bicolor',
  'Brassica oleracea', 'Brassica rapa', 'Citrus sinensis',
  'Malus domestica', 'Coffea arabica', 'Theobroma cacao',
  'Ailuropoda melanoleuca', 'Panthera tigris', 'Loxodonta africana',
  'Elephas maximus', 'Ambystoma mexicanum', 'Mammuthus primigenius',
]);

interface SpeciesEntry {
  id: string;
  scientificName: string;
  commonName: string | null;
  taxonomyId: number | null;
  source: string;
  isExtinct: boolean;
  hasGenomeData: boolean;
  tags: string[];
}

function computeTags(name: string): string[] {
  const tags: string[] = [];
  for (const [tag, set] of Object.entries(TAG_LISTS)) {
    if (set.has(name)) tags.push(tag);
  }
  return tags;
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

// ─── ID Generator ─────────────────────────────────────────────────────────────

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return 's' + idCounter;
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║   Relict Shell — Unified Species Pipeline (NCBI + GBIF + PBDB)           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  // Verify all source files
  const files = [
    ['NCBI names.dmp', NCBI_NAMES],
    ['NCBI nodes.dmp', NCBI_NODES],
    ['PBDB taxa CSV', PBDB_CSV],
    ['GBIF Taxon.tsv', GBIF_TAXON],
    ['GBIF VernacularName.tsv', GBIF_VERNACULAR],
  ] as const;

  for (const [label, filepath] of files) {
    if (!fs.existsSync(filepath)) {
      console.error(`❌ Missing required file: ${filepath} (${label})`);
      process.exit(1);
    }
    const stat = fs.statSync(filepath);
    console.log(`✓ ${label}: ${(stat.size / 1024 / 1024).toFixed(1)} MB`);
  }
  console.log('');

  const speciesMap = new Map<string, SpeciesEntry>();

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 1: Parse GBIF Vernacular Names (TaxonID -> Common Name)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('── Step 1: Parsing GBIF Vernacular Names (English Only) ──');
  const gbifVernacularEnglish = new Map<number, string>();
  {
    const stream = readline.createInterface({
      input: fs.createReadStream(GBIF_VERNACULAR, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    let isHeader = true;
    let colId = -1, colName = -1, colLang = -1;

    for await (const raw of stream) {
      if (isHeader) {
        const parts = raw.split('\t');
        colId = parts.indexOf('taxonID');
        colName = parts.indexOf('vernacularName');
        colLang = parts.indexOf('language');
        isHeader = false;
        continue;
      }

      const parts = raw.split('\t');
      const id = parseInt(parts[colId], 10);
      const name = parts[colName]?.trim();
      const lang = parts[colLang]?.trim().toLowerCase();
      if (!id || !name) continue;

      // Restrict strictly to English vernacular entries and exclude non-Latin scripts
      if (
        (lang === 'en' || lang === 'eng' || lang === 'english') &&
        !/[\u0400-\u04ff\u0600-\u06ff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u0e00-\u0e7f\u0370-\u03ff]/.test(name)
      ) {
        const formatted = name.charAt(0).toUpperCase() + name.slice(1);
        if (!gbifVernacularEnglish.has(id)) {
          gbifVernacularEnglish.set(id, formatted);
        }
      }
    }
    console.log(`  Indexed ${gbifVernacularEnglish.size.toLocaleString()} English common names from VernacularName.tsv\n`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2: Parse GBIF Backbone Taxa
  // ───────────────────────────────────────────────────────────────────────────
  console.log('── Step 2: Parsing GBIF Backbone Taxa ──');
  {
    const stream = readline.createInterface({
      input: fs.createReadStream(GBIF_TAXON, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    let isHeader = true;
    let colId = -1, colRank = -1, colCanon = -1, colSci = -1, colStatus = -1;
    let gbifCount = 0;
    let lines = 0;

    for await (const raw of stream) {
      lines++;
      if (lines % 1_500_000 === 0) {
        console.log(`    ... processed ${(lines / 1_000_000).toFixed(1)}M lines of GBIF Taxon.tsv (${speciesMap.size.toLocaleString()} species kept)`);
      }

      if (isHeader) {
        const headers = raw.split('\t');
        colId = headers.indexOf('taxonID');
        colRank = headers.indexOf('taxonRank');
        colCanon = headers.indexOf('canonicalName');
        colSci = headers.indexOf('scientificName');
        colStatus = headers.indexOf('taxonomicStatus');
        isHeader = false;
        continue;
      }

      const parts = raw.split('\t');
      const rank = parts[colRank]?.toLowerCase();
      if (rank !== 'species') continue;

      const status = parts[colStatus]?.toLowerCase();
      if (status && status !== 'accepted' && status !== 'doubtful') continue;

      let name = parts[colCanon]?.trim() || parts[colSci]?.trim();
      if (!name) continue;

      // Remove authorship if present, strip qualifiers
      name = normalizeName(name);
      if (name.includes(' sp.') || name.includes(' spp.') || name.includes(' cf.') || name.includes(' aff.')) continue;
      // Must be a valid binomial (Genus species)
      const tokens = name.split(' ');
      if (tokens.length < 2 || tokens[0].length < 2 || tokens[1].length < 2) continue;
      const binomial = `${tokens[0]} ${tokens[1]}`;

      const taxonId = parseInt(parts[colId], 10) || null;
      const commonName = taxonId ? (gbifVernacularEnglish.get(taxonId) || null) : null;

      if (!speciesMap.has(binomial)) {
        speciesMap.set(binomial, {
          id: generateId(),
          scientificName: binomial,
          commonName,
          taxonomyId: taxonId,
          source: 'gbif',
          isExtinct: false,
          hasGenomeData: GENOME_SPECIES.has(binomial),
          tags: computeTags(binomial),
        });
        gbifCount++;
      } else if (commonName && !speciesMap.get(binomial)!.commonName) {
        speciesMap.get(binomial)!.commonName = commonName;
      }
    }
    console.log(`  GBIF: loaded ${gbifCount.toLocaleString()} accepted species\n`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 3: Parse NCBI Taxonomy (Nodes + Names)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('── Step 3: Parsing NCBI Taxonomy ──');
  {
    console.log('  Reading NCBI nodes.dmp to identify species-rank tax IDs...');
    const ncbiSpeciesTaxIds = new Set<number>();
    const nodesStream = readline.createInterface({
      input: fs.createReadStream(NCBI_NODES, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    for await (const line of nodesStream) {
      const parts = line.split('\t|\t');
      if (parts[2]?.trim() === 'species') {
        ncbiSpeciesTaxIds.add(parseInt(parts[0].trim(), 10));
      }
    }
    console.log(`  Found ${ncbiSpeciesTaxIds.size.toLocaleString()} species tax IDs in NCBI nodes.dmp`);

    console.log('  Reading NCBI names.dmp...');
    const sciByTaxId = new Map<number, string>();
    const commonByTaxId = new Map<number, string>();

    const namesStream = readline.createInterface({
      input: fs.createReadStream(NCBI_NAMES, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    let lines = 0;
    for await (const line of namesStream) {
      lines++;
      if (lines % 1_500_000 === 0) {
        console.log(`    ... processed ${(lines / 1_000_000).toFixed(1)}M lines of NCBI names.dmp`);
      }
      const parts = line.split('\t|\t');
      if (parts.length < 4) continue;
      const taxId = parseInt(parts[0].trim(), 10);
      if (!ncbiSpeciesTaxIds.has(taxId)) continue;

      const name = parts[1].trim();
      const nameClass = parts[3].replace(/\t?\|$/, '').trim();

      if (nameClass === 'scientific name') {
        sciByTaxId.set(taxId, name);
      } else if (nameClass === 'genbank common name' || nameClass === 'common name') {
        if (nameClass === 'genbank common name' || !commonByTaxId.has(taxId)) {
          const formatted = name.charAt(0).toUpperCase() + name.slice(1);
          commonByTaxId.set(taxId, formatted);
        }
      }
    }

    console.log(`  Merging NCBI records into species map...`);
    let ncbiNew = 0, ncbiEnriched = 0;

    for (const [taxId, sciName] of sciByTaxId) {
      const normalized = normalizeName(sciName);
      const tokens = normalized.split(' ');
      if (tokens.length < 2) continue;
      const binomial = `${tokens[0]} ${tokens[1]}`;
      const common = commonByTaxId.get(taxId) || null;

      const existing = speciesMap.get(binomial);
      if (existing) {
        existing.taxonomyId = taxId; // Use NCBI taxonomy ID as primary standard
        if (common) existing.commonName = common; // NCBI English name is top priority
        if (!existing.source.includes('ncbi')) existing.source = `${existing.source}+ncbi`;
        ncbiEnriched++;
      } else {
        speciesMap.set(binomial, {
          id: generateId(),
          scientificName: binomial,
          commonName: common,
          taxonomyId: taxId,
          source: 'ncbi',
          isExtinct: false,
          hasGenomeData: GENOME_SPECIES.has(binomial),
          tags: computeTags(binomial),
        });
        ncbiNew++;
      }
    }
    console.log(`  NCBI merge: ${ncbiNew.toLocaleString()} new species, ${ncbiEnriched.toLocaleString()} enriched existing\n`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 4: Parse Paleobiology Database (PBDB) for Extinct Species
  // ───────────────────────────────────────────────────────────────────────────
  console.log('── Step 4: Parsing Paleobiology Database (PBDB) ──');
  {
    const stream = readline.createInterface({
      input: fs.createReadStream(PBDB_CSV, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    let isHeader = true;
    let colRank = -1, colName = -1, colExtant = -1, colAccRank = -1, colAccName = -1;
    let pbdbNew = 0, pbdbExtinctEnriched = 0;

    for await (const raw of stream) {
      const line = raw.replace(/\r$/, '');
      if (isHeader) {
        const headers = line.split(',').map(h => h.replace(/"/g, ''));
        colRank = headers.indexOf('taxon_rank');
        colName = headers.indexOf('taxon_name');
        colExtant = headers.indexOf('is_extant');
        colAccRank = headers.indexOf('accepted_rank');
        colAccName = headers.indexOf('accepted_name');
        isHeader = false;
        continue;
      }

      const fields = line.split(',').map(f => f.replace(/^"|"$/g, ''));
      const rank = fields[colAccRank] || fields[colRank];
      if (rank !== 'species') continue;

      let name = fields[colAccName] || fields[colName];
      if (!name) continue;
      name = normalizeName(name);
      if (name.includes(' sp.') || name.includes(' spp.') || name.includes(' cf.')) continue;
      const tokens = name.split(' ');
      if (tokens.length < 2) continue;
      const binomial = `${tokens[0]} ${tokens[1]}`;

      const extantField = fields[colExtant]?.toLowerCase();
      const isExtinct = extantField === 'extinct';

      const existing = speciesMap.get(binomial);
      if (existing) {
        if (isExtinct) {
          existing.isExtinct = true;
          pbdbExtinctEnriched++;
        }
        if (!existing.source.includes('pbdb')) existing.source += '+pbdb';
      } else {
        speciesMap.set(binomial, {
          id: generateId(),
          scientificName: binomial,
          commonName: null,
          taxonomyId: null,
          source: 'pbdb',
          isExtinct,
          hasGenomeData: GENOME_SPECIES.has(binomial),
          tags: computeTags(binomial),
        });
        pbdbNew++;
        if (isExtinct) pbdbExtinctEnriched++;
      }
    }
    console.log(`  PBDB merge: ${pbdbNew.toLocaleString()} new fossil species, ${pbdbExtinctEnriched.toLocaleString()} total extinct flagged\n`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 5: Final Summary Statistics
  // ───────────────────────────────────────────────────────────────────────────
  const totalCount = speciesMap.size;
  let extinctTotal = 0, taggedTotal = 0, genomeTotal = 0, commonTotal = 0;
  const tagBreakdown: Record<string, number> = {};

  for (const s of speciesMap.values()) {
    if (s.isExtinct) extinctTotal++;
    if (s.tags.length > 0) {
      taggedTotal++;
      for (const t of s.tags) {
        tagBreakdown[t] = (tagBreakdown[t] || 0) + 1;
      }
    }
    if (s.hasGenomeData) genomeTotal++;
    if (s.commonName) commonTotal++;
  }

  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║   Merged Species Dataset Statistics                                      ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Distinct Species:    ${totalCount.toLocaleString().padEnd(43)}║`);
  console.log(`║  Species with Common Names: ${commonTotal.toLocaleString().padEnd(43)}║`);
  console.log(`║  Extinct / Fossil Species:  ${extinctTotal.toLocaleString().padEnd(43)}║`);
  console.log(`║  Sequenced Genome Species:  ${genomeTotal.toLocaleString().padEnd(43)}║`);
  console.log(`║  Tagged Scope Species:      ${taggedTotal.toLocaleString().padEnd(43)}║`);
  for (const [tag, count] of Object.entries(tagBreakdown)) {
    console.log(`║    • [${tag}]: ${count.toLocaleString().padEnd(52 - tag.length)}║`);
  }
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 6: Stream into PostgreSQL using pg COPY Protocol
  // ───────────────────────────────────────────────────────────────────────────
  console.log('── Step 6: Streaming into PostgreSQL Database via COPY protocol ──');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is missing!');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('  ✓ Connected to Neon PostgreSQL database');

  try {
    // 1. Ensure pg_trgm extension
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    console.log('  ✓ pg_trgm extension verified');

    // 2. Truncate Species table
    console.log('  Truncating Species table...');
    await client.query('TRUNCATE TABLE "Species" CASCADE');
    console.log('  ✓ Species table clean (0 rows)');

    // 3. Drop indexes for instantaneous COPY ingestion
    console.log('  Dropping existing indexes for ultra-fast COPY ingestion...');
    await client.query('DROP INDEX IF EXISTS "Species_scientificName_trgm"');
    await client.query('DROP INDEX IF EXISTS "Species_commonName_trgm"');
    await client.query('DROP INDEX IF EXISTS "Species_taxonomyId_idx"');
    await client.query('DROP INDEX IF EXISTS "Species_tags_idx"');
    console.log('  ✓ Indexes dropped');

    // 4. Prioritize and select top 1,400,000 highest-value species (perfectly fits 512MB quota with all 4 GIN/B-tree indexes)
    const MAX_SPECIES_CAP = 1_400_000;
    const allEntries = Array.from(speciesMap.values());
    
    function getPriority(e: SpeciesEntry): number {
      let score = 0;
      if (e.tags.length > 0) score += 100000;
      if (e.hasGenomeData) score += 50000;
      if (e.commonName) score += 20000;
      if (e.isExtinct) score += 10000;
      if (e.source.includes('ncbi')) score += 5000;
      if (e.source.includes('pbdb')) score += 3000;
      score += 1000;
      return score;
    }

    console.log(`  Sorting and selecting top ${MAX_SPECIES_CAP.toLocaleString()} highest-value species...`);
    allEntries.sort((a, b) => getPriority(b) - getPriority(a));
    const entries = allEntries.slice(0, MAX_SPECIES_CAP);

    let currentIndex = 0;
    const nowStr = new Date().toISOString();

    const copyStream = new Readable({
      read(size) {
        let chunk = '';
        while (currentIndex < entries.length) {
          const item = entries[currentIndex++];
          
          // Escape TSV columns for PostgreSQL text COPY
          // Format: id \t scientificName \t commonName \t taxonomyId \t source \t isExtinct \t hasGenomeData \t tags \t createdAt \t updatedAt \n
          const id = item.id;
          const sci = item.scientificName.replace(/[\t\n\r\\]/g, ' ');
          const com = item.commonName ? item.commonName.replace(/[\t\n\r\\]/g, ' ') : '\\N';
          const taxId = item.taxonomyId !== null ? String(item.taxonomyId) : '\\N';
          const source = item.source.replace(/[\t\n\r\\]/g, ' ');
          const isExtinct = item.isExtinct ? 't' : 'f';
          const hasGenome = item.hasGenomeData ? 't' : 'f';
          const tags = item.tags.length > 0 ? `{${item.tags.join(',')}}` : '{}';

          chunk += `${id}\t${sci}\t${com}\t${taxId}\t${source}\t${isExtinct}\t${hasGenome}\t${tags}\t${nowStr}\t${nowStr}\n`;

          if (chunk.length >= 65536) {
            this.push(chunk);
            chunk = '';
            return;
          }
        }

        if (chunk.length > 0) {
          this.push(chunk);
        }
        this.push(null); // EOF
      },
    });

    console.log(`  Streaming ${entries.length.toLocaleString()} species records into PostgreSQL COPY...`);
    const copyQuery = copyFrom(`
      COPY "Species" (id, "scientificName", "commonName", "taxonomyId", source, "isExtinct", "hasGenomeData", tags, "createdAt", "updatedAt")
      FROM STDIN WITH (FORMAT text, NULL '\\N')
    `);

    const ingestStream = client.query(copyQuery);
    const startTime = Date.now();

    await pipeline(copyStream, ingestStream);

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ✓ COPY stream finished in ${durationSec}s!`);

    // 5. Recreate Indexes with partial index optimizations
    console.log('── Step 7: Rebuilding PostgreSQL Trigram and GIN indexes ──');
    console.log('  Building GIN trigram index on scientificName...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Species_scientificName_trgm"
      ON "Species" USING gin ("scientificName" gin_trgm_ops)
    `);
    console.log('  ✓ scientificName trigram index ready');

    console.log('  Building GIN trigram index on commonName (partial index)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Species_commonName_trgm"
      ON "Species" USING gin ("commonName" gin_trgm_ops)
      WHERE "commonName" IS NOT NULL
    `);
    console.log('  ✓ commonName trigram index ready');

    console.log('  Building GIN index on tags (partial index)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Species_tags_idx"
      ON "Species" USING gin (tags)
      WHERE array_length(tags, 1) > 0
    `);
    console.log('  ✓ tags GIN index ready');

    console.log('  Building B-tree index on taxonomyId (partial index)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Species_taxonomyId_idx"
      ON "Species" ("taxonomyId")
      WHERE "taxonomyId" IS NOT NULL
    `);
    console.log('  ✓ taxonomyId index ready');

    // 6. Verify row count
    const res = await client.query('SELECT COUNT(*) as count FROM "Species"');
    const finalCount = parseInt(res.rows[0].count, 10);
    console.log(`\n🎉 ALL DONE! Total species live in PostgreSQL: ${finalCount.toLocaleString()}`);

  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error in species import:', err);
  process.exit(1);
});
