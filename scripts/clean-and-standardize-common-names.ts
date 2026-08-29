import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Curated accurate dictionary for domestic, livestock, crop, model, and iconic taxa
const ACCURATE_ICONIC_NAMES: Record<string, { commonName: string; extraTags?: string[] }> = {
  // Bovines & Cattle
  "Bos taurus": { commonName: "Domestic cow", extraTags: ["livestock", "cow", "cattle", "bovine"] },
  "Bos indicus": { commonName: "Zebu cattle", extraTags: ["livestock", "cow", "cattle", "zebu"] },
  "Bos primigenius": { commonName: "Aurochs", extraTags: ["extinct", "bovine"] },
  "Bos grunniens": { commonName: "Domestic yak", extraTags: ["livestock", "yak"] },
  "Bos mutus": { commonName: "Wild yak", extraTags: ["endangered", "yak"] },
  "Bos javanicus": { commonName: "Banteng", extraTags: ["endangered", "livestock"] },
  "Bos gaurus": { commonName: "Gaur", extraTags: ["endangered", "bovine"] },
  "Bos frontalis": { commonName: "Gayal", extraTags: ["livestock", "bovine"] },
  "Bos sauveli": { commonName: "Kouprey", extraTags: ["endangered", "bovine"] },
  "Bubalus bubalis": { commonName: "Water buffalo", extraTags: ["livestock", "buffalo"] },
  "Bubalus arnee": { commonName: "Wild water buffalo", extraTags: ["endangered", "buffalo"] },
  "Syncerus caffer": { commonName: "African buffalo", extraTags: ["buffalo"] },
  "Bison bison": { commonName: "American bison", extraTags: ["bison", "buffalo"] },
  "Bison bonasus": { commonName: "European bison", extraTags: ["endangered", "bison"] },

  // Sheep & Goats
  "Ovis aries": { commonName: "Domestic sheep", extraTags: ["livestock", "sheep", "lamb"] },
  "Ovis orientalis": { commonName: "Mouflon", extraTags: ["sheep"] },
  "Ovis gmelini": { commonName: "Mouflon", extraTags: ["sheep"] },
  "Ovis ammon": { commonName: "Argali", extraTags: ["sheep"] },
  "Ovis canadensis": { commonName: "Bighorn sheep", extraTags: ["sheep"] },
  "Capra hircus": { commonName: "Domestic goat", extraTags: ["livestock", "goat"] },
  "Capra aegagrus": { commonName: "Wild goat", extraTags: ["goat"] },
  "Capra ibex": { commonName: "Alpine ibex", extraTags: ["goat"] },

  // Pigs & Swine
  "Sus scrofa": { commonName: "Wild boar", extraTags: ["livestock", "pig", "boar", "swine"] },
  "Sus domesticus": { commonName: "Domestic pig", extraTags: ["livestock", "pig", "swine", "hog"] },
  "Sus scrofa domesticus": { commonName: "Domestic pig", extraTags: ["livestock", "pig", "swine", "hog"] },

  // Poultry & Birds
  "Gallus gallus": { commonName: "Chicken", extraTags: ["livestock", "chicken", "poultry", "fowl"] },
  "Gallus gallus domesticus": { commonName: "Domestic chicken", extraTags: ["livestock", "chicken", "poultry"] },
  "Meleagris gallopavo": { commonName: "Wild turkey", extraTags: ["livestock", "turkey", "poultry"] },
  "Anas platyrhynchos": { commonName: "Mallard duck", extraTags: ["livestock", "duck", "poultry"] },
  "Anas platyrhynchos domesticus": { commonName: "Domestic duck", extraTags: ["livestock", "duck", "poultry"] },
  "Anser anser": { commonName: "Greylag goose", extraTags: ["livestock", "goose", "poultry"] },
  "Anser anser domesticus": { commonName: "Domestic goose", extraTags: ["livestock", "goose", "poultry"] },
  "Anser cygnoides": { commonName: "Swan goose", extraTags: ["livestock", "goose", "poultry"] },
  "Anser cygnoides domesticus": { commonName: "Chinese goose", extraTags: ["livestock", "goose", "poultry"] },
  "Columba livia": { commonName: "Rock pigeon", extraTags: ["pigeon", "bird"] },
  "Columba livia domestica": { commonName: "Domestic pigeon", extraTags: ["pigeon", "bird"] },
  "Numida meleagris": { commonName: "Helmeted guineafowl", extraTags: ["livestock", "poultry"] },
  "Coturnix japonica": { commonName: "Japanese quail", extraTags: ["livestock", "poultry", "quail"] },

  // Equines
  "Equus caballus": { commonName: "Horse", extraTags: ["livestock", "horse", "equine"] },
  "Equus ferus caballus": { commonName: "Domestic horse", extraTags: ["livestock", "horse", "equine"] },
  "Equus ferus": { commonName: "Wild horse", extraTags: ["endangered", "horse"] },
  "Equus ferus przewalskii": { commonName: "Przewalski's horse", extraTags: ["endangered", "horse"] },
  "Equus asinus": { commonName: "Donkey", extraTags: ["livestock", "donkey", "ass"] },
  "Equus africanus": { commonName: "African wild ass", extraTags: ["endangered", "donkey"] },
  "Equus quagga": { commonName: "Plains zebra", extraTags: ["zebra"] },
  "Equus zebra": { commonName: "Mountain zebra", extraTags: ["zebra"] },
  "Equus grevyi": { commonName: "Grevy's zebra", extraTags: ["endangered", "zebra"] },

  // Pets & Carnivores
  "Canis lupus": { commonName: "Wolf", extraTags: ["wolf", "canine"] },
  "Canis lupus familiaris": { commonName: "Domestic dog", extraTags: ["dog", "canine", "pet"] },
  "Canis familiaris": { commonName: "Domestic dog", extraTags: ["dog", "canine", "pet"] },
  "Canis latrans": { commonName: "Coyote", extraTags: ["canine"] },
  "Canis aureus": { commonName: "Golden jackal", extraTags: ["canine"] },
  "Vulpes vulpes": { commonName: "Red fox", extraTags: ["fox"] },
  "Vulpes rueppellii": { commonName: "Rüppell's fox", extraTags: ["fox"] },
  "Felis catus": { commonName: "Domestic cat", extraTags: ["cat", "feline", "pet", "invasive"] },
  "Felis silvestris": { commonName: "Wildcat", extraTags: ["cat", "feline"] },
  "Felis silvestris catus": { commonName: "Domestic cat", extraTags: ["cat", "feline", "pet"] },
  "Panthera leo": { commonName: "Lion", extraTags: ["lion", "big-cat"] },
  "Panthera tigris": { commonName: "Tiger", extraTags: ["endangered", "tiger", "big-cat"] },
  "Panthera pardus": { commonName: "Leopard", extraTags: ["endangered", "leopard", "big-cat"] },
  "Panthera onca": { commonName: "Jaguar", extraTags: ["jaguar", "big-cat"] },
  "Panthera uncia": { commonName: "Snow leopard", extraTags: ["endangered", "snow-leopard"] },
  "Acinonyx jubatus": { commonName: "Cheetah", extraTags: ["endangered", "cheetah"] },
  "Puma concolor": { commonName: "Cougar", extraTags: ["mountain-lion", "puma"] },

  // Extinct Iconic
  "Mammuthus primigenius": { commonName: "Woolly mammoth", extraTags: ["extinct", "mammoth", "de-extinction"] },
  "Mammut americanum": { commonName: "American mastodon", extraTags: ["extinct", "mastodon"] },
  "Ectopistes migratorius": { commonName: "Passenger pigeon", extraTags: ["extinct", "pigeon", "de-extinction"] },
  "Raphus cucullatus": { commonName: "Dodo", extraTags: ["extinct", "dodo", "de-extinction"] },
  "Thylacinus cynocephalus": { commonName: "Tasmanian tiger", extraTags: ["extinct", "thylacine", "de-extinction"] },
  "Smilodon fatalis": { commonName: "Saber-toothed cat", extraTags: ["extinct", "smilodon"] },
  "Hydrodamalis gigas": { commonName: "Steller's sea cow", extraTags: ["extinct", "sea-cow", "de-extinction"] },
  "Pinguinus impennis": { commonName: "Great auk", extraTags: ["extinct", "auk", "de-extinction"] },
  "Conuropsis carolinensis": { commonName: "Carolina parakeet", extraTags: ["extinct", "parakeet", "de-extinction"] },
  "Tympanuchus cupido cupido": { commonName: "Heath hen", extraTags: ["extinct", "de-extinction"] },
  "Dinornis robustus": { commonName: "South Island giant moa", extraTags: ["extinct", "moa", "de-extinction"] },

  // Model & Chassis
  "Homo sapiens": { commonName: "Human", extraTags: ["model-organism"] },
  "Mus musculus": { commonName: "House mouse", extraTags: ["model-organism", "mouse"] },
  "Rattus norvegicus": { commonName: "Brown rat", extraTags: ["model-organism", "rat"] },
  "Rattus rattus": { commonName: "Black rat", extraTags: ["invasive", "rat"] },
  "Cavia porcellus": { commonName: "Guinea pig", extraTags: ["model-organism", "guinea-pig"] },
  "Oryctolagus cuniculus": { commonName: "European rabbit", extraTags: ["model-organism", "rabbit"] },
  "Mesocricetus auratus": { commonName: "Golden hamster", extraTags: ["model-organism", "hamster"] },
  "Danio rerio": { commonName: "Zebrafish", extraTags: ["model-organism", "fish"] },
  "Xenopus laevis": { commonName: "African clawed frog", extraTags: ["model-organism", "frog"] },
  "Drosophila melanogaster": { commonName: "Fruit fly", extraTags: ["model-organism", "fly"] },
  "Caenorhabditis elegans": { commonName: "Roundworm", extraTags: ["model-organism", "worm"] },
  "Saccharomyces cerevisiae": { commonName: "Baker's yeast", extraTags: ["chassis", "yeast"] },
  "Schizosaccharomyces pombe": { commonName: "Fission yeast", extraTags: ["chassis", "yeast"] },
  "Escherichia coli": { commonName: "E. coli", extraTags: ["chassis", "bacteria"] },
  "Bacillus subtilis": { commonName: "Hay bacillus", extraTags: ["chassis", "bacteria"] },
  "Chlamydomonas reinhardtii": { commonName: "Green alga", extraTags: ["chassis", "algae"] },
  "Brassica oleracea": { commonName: "Wild cabbage", extraTags: ["crop", "cabbage", "broccoli"] }
};

// Fix mojibake / corrupted encoding strings
function fixEncoding(str: string): string {
  return str
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã¼/g, "ü")
    .replace(/Ã¶/g, "ö")
    .replace(/Ã¤/g, "ä")
    .replace(/Ã…/g, "Å")
    .replace(/Ã¦/g, "æ")
    .replace(/Ã¸/g, "ø")
    .replace(/Ru\[\.\.\]ppell/gi, "Rüppell")
    .replace(/\[\.\.\]/g, "");
}

// Clean and standardize common names
function sanitizeCommonName(raw: string | null, scientificName: string): string | null {
  if (!raw) return null;

  // Check curated exact match
  if (ACCURATE_ICONIC_NAMES[scientificName]) {
    return ACCURATE_ICONIC_NAMES[scientificName].commonName;
  }

  let name = fixEncoding(raw).trim();

  // Reject garbage patterns, isolate codes, specimen notes, metadata
  const garbageRegex = /^(species code:|section [a-z0-9]|specimen|locality|endocytobiont of|propionibacterium sp|oral taxon|unknown|unidentified|sp\.|cf\.|g__|p__|f__|uba\d|mag\d)/i;
  if (garbageRegex.test(name) || /species code:/i.test(name) || /bakony mts/i.test(name) || /see ognev/i.test(name) || /see comments/i.test(name) || /balachowsky/i.test(name)) {
    return null;
  }

  // Reject pure genome/taxonomic code strings (e.g. G__RKRP01, P__CSP1-3)
  if (/^[GPF]__[A-Z0-9_-]+$/i.test(name) || /^UBA\d+$/i.test(name)) {
    return null;
  }

  // If there are multiple names separated by / , ; take the first
  if (name.includes("/")) {
    name = name.split("/")[0].trim();
  }
  if (name.includes(";")) {
    name = name.split(";")[0].trim();
  }
  if (name.includes(",")) {
    const parts = name.split(",");
    if (parts.length > 1 && parts[0].length > 2) {
      name = parts[0].trim();
    }
  }

  // Remove square bracket annotations e.g. "[reticuloriens]", "[Double-barred]", "[manueli]"
  name = name.replace(/\[[^\]]*\]/g, "").trim();

  // If the whole name was wrapped in parens e.g. "(Indian) Bark Gecko", extract it
  // or "(Dekay's) Brown Snake" -> "Dekay's Brown Snake"
  name = name.replace(/\(([^)]+)\)/g, (_m, inside) => {
    // If inside is a qualifier like "cinnamomeus Group" or "subspecies" or "Edible Variety" or "see ...", drop it
    if (/group|variety|subspecies|balachowsky|rana|known as|pronounced|ognev|texas|comments|incorrect/i.test(inside)) {
      return "";
    }
    // Otherwise include the word without parentheses e.g. "(Indian)" -> "Indian"
    return inside;
  });

  // Remove any leftover unmatched parens or brackets
  name = name.replace(/[\(\)\[\]\{\}]/g, "").trim();

  // Clean quotes and special symbols
  name = name.replace(/["“”`]/g, "");
  name = name.replace(/[?*+^$#@!~_=<>|\\%]/g, "").trim();

  // Normalize apostrophes: e.g. ’ -> '
  name = name.replace(/[’‘]/g, "'");

  // Fix casing after apostrophe: e.g. "Clark'S" -> "Clark's", "Dekay'S" -> "Dekay's"
  name = name.replace(/'S\b/g, "'s");

  // Clean leading/trailing punctuation
  name = name.replace(/^[-:;,.\s]+|[-:;,.\s]+$/g, "").trim();

  // If the result is empty or too short or pure digits
  if (name.length < 2 || /^\d+$/.test(name)) {
    return null;
  }

  // Normalize spaces
  name = name.replace(/\s+/g, " ");

  // Ensure initial letter is capitalized
  name = name.charAt(0).toUpperCase() + name.slice(1);

  return name;
}

async function main() {
  console.log("=== STARTING COMMON NAMES CLEANUP & ENRICHMENT ===");

  const species = await prisma.species.findMany({
    where: { commonName: { not: null } },
    select: { id: true, scientificName: true, commonName: true, tags: true }
  });

  console.log(`Auditing ${species.length} species records...`);

  let updatedCount = 0;
  let nulledCount = 0;
  let curatedCount = 0;

  const updates: Array<{ id: string; commonName: string | null; tags: string[] }> = [];

  for (const s of species) {
    const cleaned = sanitizeCommonName(s.commonName, s.scientificName);
    let newTags = [...s.tags];

    // If curated, merge tags
    const curated = ACCURATE_ICONIC_NAMES[s.scientificName];
    if (curated) {
      curatedCount++;
      if (curated.extraTags) {
        for (const t of curated.extraTags) {
          if (!newTags.includes(t)) {
            newTags.push(t);
          }
        }
      }
    }

    if (cleaned !== s.commonName || curated) {
      updatedCount++;
      if (cleaned === null) nulledCount++;
      updates.push({
        id: s.id,
        commonName: cleaned,
        tags: newTags
      });
    }
  }

  // Also check if any curated species had commonName = null and need to be populated
  const curatedKeys = Object.keys(ACCURATE_ICONIC_NAMES);
  const nullCurated = await prisma.species.findMany({
    where: {
      scientificName: { in: curatedKeys },
      commonName: null
    },
    select: { id: true, scientificName: true, tags: true }
  });

  for (const s of nullCurated) {
    const curated = ACCURATE_ICONIC_NAMES[s.scientificName];
    if (curated) {
      let newTags = [...s.tags];
      if (curated.extraTags) {
        for (const t of curated.extraTags) {
          if (!newTags.includes(t)) newTags.push(t);
        }
      }
      updates.push({
        id: s.id,
        commonName: curated.commonName,
        tags: newTags
      });
      updatedCount++;
    }
  }

  console.log(`Prepared ${updates.length} updates (${nulledCount} nulled junk codes, ${curatedCount} curated overrides).`);

  // Batch execute updates using direct parameterized SQL batches of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    
    // Build single multi-row UPDATE query:
    // UPDATE "Species" AS s SET "commonName" = v.name, tags = v.tags::text[] FROM (VALUES ...) AS v(id, name, tags) WHERE s.id = v.id
    const valuesClauses: string[] = [];
    const params: any[] = [];

    batch.forEach((item, idx) => {
      const p1 = idx * 3 + 1;
      const p2 = idx * 3 + 2;
      const p3 = idx * 3 + 3;
      valuesClauses.push(`($${p1}::text, $${p2}::text, $${p3}::text[])`);
      params.push(item.id, item.commonName, item.tags);
    });

    const sql = `
      UPDATE "Species" AS s
      SET "commonName" = v.name,
          tags = v.tags
      FROM (VALUES ${valuesClauses.join(", ")}) AS v(id, name, tags)
      WHERE s.id = v.id
    `;

    await prisma.$executeRawUnsafe(sql, ...params);
    console.log(`Updated ${Math.min(i + BATCH_SIZE, updates.length)} / ${updates.length}...`);
  }

  console.log("=== CLEANUP COMPLETED SUCCESSFULLY ===");

  // Verification samples
  const checkSample = await prisma.species.findMany({
    where: {
      scientificName: {
        in: [
          "Bos taurus",
          "Bos indicus",
          "Bos primigenius",
          "Ovis aries",
          "Gallus gallus",
          "Sus scrofa",
          "Equus caballus",
          "Vulpes rueppellii",
          "Duvalia hungarica",
          "Lepilaena australis",
          "Brassica oleracea",
          "Thylacinus cynocephalus"
        ]
      }
    },
    select: { scientificName: true, commonName: true, tags: true }
  });
  console.log("\n=== VERIFICATION SAMPLE ===");
  console.log(JSON.stringify(checkSample, null, 2));

  // Check remaining symbols
  const remainingSymbols: any = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(CASE WHEN "commonName" LIKE '%(%' THEN 1 END)::int as with_parens,
      COUNT(CASE WHEN "commonName" LIKE '%[%' THEN 1 END)::int as with_brackets,
      COUNT(CASE WHEN "commonName" LIKE '%/%' THEN 1 END)::int as with_slash,
      COUNT(CASE WHEN "commonName" LIKE '%;%' THEN 1 END)::int as with_semicolon,
      COUNT(CASE WHEN "commonName" LIKE '%:%' THEN 1 END)::int as with_colon,
      COUNT(CASE WHEN "commonName" LIKE '%"%' THEN 1 END)::int as with_quotes
    FROM "Species"
    WHERE "commonName" IS NOT NULL
  `);
  console.log("\n=== REMAINING SYMBOLS IN DATABASE ===");
  console.log(remainingSymbols);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
