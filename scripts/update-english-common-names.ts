#!/usr/bin/env tsx
/**
 * Relict Shell — English Common Names Normalizer & Database Updater
 *
 * 1. Extracts verified English common names from:
 *    - GBIF Backbone (VernacularName.tsv [lang=en] -> Taxon.tsv canonicalName)
 *    - NCBI Taxonomy (names.dmp -> genbank common name, common name, blast name)
 *    - Curated encyclopedic common names for iconic taxa
 * 2. Purges non-English foreign-language names (Chinese, Cyrillic, Dutch, Swedish, German, etc.)
 * 3. Applies verified English common names to all matching species in PostgreSQL.
 *
 * Usage: npx tsx scripts/update-english-common-names.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import pkgPg from 'pg';
const { Client } = pkgPg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
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

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in .env');
  process.exit(1);
}

const DOWNLOADS = path.resolve(__dirname, '..', 'downloads');
const NCBI_NAMES = path.join(DOWNLOADS, 'ncbi', 'names.dmp');
const GBIF_TAXON = path.join(DOWNLOADS, 'gbif', 'backbone', 'Taxon.tsv');
const GBIF_VERNACULAR = path.join(DOWNLOADS, 'gbif', 'backbone', 'VernacularName.tsv');

// Curated high-confidence English common names for major & iconic taxa
const CURATED_ENGLISH_NAMES: Record<string, string> = {
  // Iconic Mammals
  'Homo sapiens': 'Human',
  'Pan troglodytes': 'Chimpanzee',
  'Pan paniscus': 'Bonobo',
  'Gorilla gorilla': 'Western gorilla',
  'Gorilla beringei': 'Eastern gorilla',
  'Pongo pygmaeus': 'Bornean orangutan',
  'Pongo abelii': 'Sumatran orangutan',
  'Pongo tapanuliensis': 'Tapanuli orangutan',
  'Panthera leo': 'Lion',
  'Panthera tigris': 'Tiger',
  'Panthera onca': 'Jaguar',
  'Panthera pardus': 'Leopard',
  'Panthera uncia': 'Snow leopard',
  'Acinonyx jubatus': 'Cheetah',
  'Puma concolor': 'Cougar',
  'Ailuropoda melanoleuca': 'Giant panda',
  'Ursus arctos': 'Brown bear',
  'Ursus maritimus': 'Polar bear',
  'Ursus americanus': 'American black bear',
  'Elephas maximus': 'Asian elephant',
  'Loxodonta africana': 'African bush elephant',
  'Loxodonta cyclotis': 'African forest elephant',
  'Diceros bicornis': 'Black rhinoceros',
  'Ceratotherium simum': 'White rhinoceros',
  'Rhinoceros unicornis': 'Indian rhinoceros',
  'Rhinoceros sondaicus': 'Javan rhinoceros',
  'Dicerorhinus sumatrensis': 'Sumatran rhinoceros',
  'Balaenoptera musculus': 'Blue whale',
  'Megaptera novaeangliae': 'Humpback whale',
  'Orcinus orca': 'Killer whale',
  'Physeter macrocephalus': 'Sperm whale',
  'Delphinus delphis': 'Short-beaked common dolphin',
  'Tursiops truncatus': 'Common bottlenose dolphin',
  'Hippopotamus amphibius': 'Hippopotamus',
  'Giraffa camelopardalis': 'Giraffe',
  'Equus caballus': 'Horse',
  'Equus quagga': 'Plains zebra',
  'Equus asinus': 'Donkey',
  'Canis lupus': 'Wolf',
  'Canis lupus familiaris': 'Domestic dog',
  'Vulpes vulpes': 'Red fox',
  'Felis catus': 'Domestic cat',
  'Phascolarctos cinereus': 'Koala',
  'Macropus rufus': 'Red kangaroo',
  'Ornithorhynchus anatinus': 'Platypus',
  'Tachyglossus aculeatus': 'Short-beaked echidna',
  'Daubentonia madagascariensis': 'Aye-aye',
  'Lemur catta': 'Ring-tailed lemur',
  'Varecia variegata': 'Black-and-white ruffed lemur',

  // Extinct / De-Extinction Taxa
  'Mammuthus primigenius': 'Woolly mammoth',
  'Mammuthus columbi': 'Columbian mammoth',
  'Mammut americanum': 'American mastodon',
  'Thylacinus cynocephalus': 'Thylacine (Tasmanian tiger)',
  'Raphus cucullatus': 'Dodo',
  'Pinguinus impennis': 'Great auk',
  'Ectopistes migratorius': 'Passenger pigeon',
  'Smilodon fatalis': 'Saber-toothed cat',
  'Coelodonta antiquitatis': 'Woolly rhinoceros',
  'Hydrodamalis gigas': 'Steller\'s sea cow',
  'Dinornis novaezealandiae': 'North Island giant moa',
  'Aepyornis maximus': 'Giant elephant bird',
  'Camelops hesternus': 'Yesterday\'s camel',
  'Megatherium americanum': 'Giant ground sloth',
  'Castoroides ohioensis': 'Giant beaver',
  'Dromaius novaehollandiae': 'Emu',
  'Struthio camelus': 'Common ostrich',
  'Apteryx australis': 'Southern brown kiwi',

  // Amphibians & Reptiles
  'Ambystoma mexicanum': 'Axolotl',
  'Rana temporaria': 'Common frog',
  'Bufo bufo': 'Common toad',
  'Rhinella marina': 'Cane toad',
  'Dendrobates tinctorius': 'Dyeing dart frog',
  'Varanus komodoensis': 'Komodo dragon',
  'Crocodylus porosus': 'Saltwater crocodile',
  'Alligator mississippiensis': 'American alligator',
  'Dermochelys coriacea': 'Leatherback sea turtle',
  'Chelonia mydas': 'Green sea turtle',
  'Caretta caretta': 'Loggerhead sea turtle',
  'Eretmochelys imbricata': 'Hawksbill sea turtle',
  'Ophiophagus hannah': 'King cobra',
  'Naja naja': 'Indian cobra',
  'Python reticulatus': 'Reticulated python',

  // Marine & Fish
  'Rhincodon typus': 'Whale shark',
  'Carcharodon carcharias': 'Great white shark',
  'Salmo salar': 'Atlantic salmon',
  'Oncorhynchus mykiss': 'Rainbow trout',
  'Danio rerio': 'Zebrafish',
  'Gadus morhua': 'Atlantic cod',
  'Thunnus thynnus': 'Atlantic bluefin tuna',
  'Latimeria chalumnae': 'West Indian Ocean coelacanth',

  // Crops & Plants
  'Oryza sativa': 'Asian rice',
  'Zea mays': 'Corn (Maize)',
  'Triticum aestivum': 'Common wheat',
  'Glycine max': 'Soybean',
  'Solanum tuberosum': 'Potato',
  'Solanum lycopersicum': 'Tomato',
  'Musa acuminata': 'Banana',
  'Malus domestica': 'Apple',
  'Vitis vinifera': 'Common grape vine',
  'Coffea arabica': 'Arabica coffee',
  'Theobroma cacao': 'Cocoa tree',
  'Camellia sinensis': 'Tea plant',
  'Brassica oleracea': 'Wild cabbage (Broccoli/Kale)',
  'Beta vulgaris': 'Beetroot',
  'Helianthus annuus': 'Common sunflower',
  'Arabidopsis thaliana': 'Thale cress',
  'Sequoiadendron giganteum': 'Giant sequoia',
  'Ginkgo biloba': 'Ginkgo',

  // Model Organisms & SynBio Chassis
  'Escherichia coli': 'E. coli',
  'Saccharomyces cerevisiae': 'Baker\'s yeast',
  'Bacillus subtilis': 'Hay bacillus',
  'Caenorhabditis elegans': 'Roundworm',
  'Drosophila melanogaster': 'Fruit fly',
  'Mus musculus': 'House mouse',
  'Rattus norvegicus': 'Brown rat',
  'Apis mellifera': 'Western honey bee',
  'Bombyx mori': 'Domestic silkmoth',
  'Aedes aegypti': 'Yellow fever mosquito',
  'Anopheles gambiae': 'African malaria mosquito',
};

function isCleanEnglish(text: string): boolean {
  if (!text) return false;
  // Exclude non-Latin / non-ASCII unicode scripts (CJK, Cyrillic, Arabic, etc.)
  if (/[\u0400-\u04ff\u0600-\u06ff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u0e00-\u0e7f\u0370-\u03ff]/.test(text)) {
    return false;
  }
  return true;
}

function formatEnglishName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║   Relict Shell — English Common Names Normalizer                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const englishCommonNames = new Map<string, string>();

  // 1. Seed with Curated English Names
  for (const [sci, common] of Object.entries(CURATED_ENGLISH_NAMES)) {
    englishCommonNames.set(sci, common);
  }
  console.log(`✓ Seeded ${englishCommonNames.size} curated English common names.`);

  // 2. Parse GBIF English Vernacular Names
  if (fs.existsSync(GBIF_VERNACULAR) && fs.existsSync(GBIF_TAXON)) {
    console.log('\n── Parsing GBIF English Vernacular Names ──');
    const taxonIdToEnglish = new Map<number, string>();
    {
      const vStream = readline.createInterface({
        input: fs.createReadStream(GBIF_VERNACULAR, { encoding: 'utf-8' }),
        crlfDelay: Infinity,
      });

      let isHeader = true;
      let colId = -1, colName = -1, colLang = -1;

      for await (const raw of vStream) {
        if (isHeader) {
          const parts = raw.split('\t');
          colId = parts.indexOf('taxonID');
          colName = parts.indexOf('vernacularName');
          colLang = parts.indexOf('language');
          isHeader = false;
          continue;
        }
        const parts = raw.split('\t');
        const lang = (parts[colLang] || '').trim().toLowerCase();
        if (lang === 'en' || lang === 'eng' || lang === 'english') {
          const id = parseInt(parts[colId], 10);
          const name = (parts[colName] || '').trim();
          if (id && name && isCleanEnglish(name) && !taxonIdToEnglish.has(id)) {
            taxonIdToEnglish.set(id, formatEnglishName(name));
          }
        }
      }
      console.log(`  Indexed ${taxonIdToEnglish.size.toLocaleString()} GBIF English vernacular entries.`);
    }

    console.log('  Mapping GBIF Taxon.tsv canonical names...');
    {
      const tStream = readline.createInterface({
        input: fs.createReadStream(GBIF_TAXON, { encoding: 'utf-8' }),
        crlfDelay: Infinity,
      });

      let isHeader = true;
      let colTaxonId = -1, colCanonical = -1;

      for await (const raw of tStream) {
        if (isHeader) {
          const parts = raw.split('\t');
          colTaxonId = parts.indexOf('taxonID');
          colCanonical = parts.indexOf('canonicalName');
          isHeader = false;
          continue;
        }
        const parts = raw.split('\t');
        const id = parseInt(parts[colTaxonId], 10);
        const eng = taxonIdToEnglish.get(id);
        if (eng) {
          const canonical = (parts[colCanonical] || '').trim();
          if (canonical && isCleanEnglish(eng) && !englishCommonNames.has(canonical)) {
            englishCommonNames.set(canonical, eng);
          }
        }
      }
      console.log(`  Total English names after GBIF: ${englishCommonNames.size.toLocaleString()}`);
    }
  }

  // 3. Parse NCBI English Common Names
  if (fs.existsSync(NCBI_NAMES)) {
    console.log('\n── Parsing NCBI names.dmp English Common Names ──');
    const nStream = readline.createInterface({
      input: fs.createReadStream(NCBI_NAMES, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    const ncbiTaxIdToSci = new Map<number, string>();
    const ncbiTaxIdToCommon = new Map<number, string>();

    for await (const line of nStream) {
      const parts = line.split('\t|\t');
      if (parts.length < 4) continue;
      const taxId = parseInt(parts[0].replace('\t|', '').trim(), 10);
      const nameTxt = parts[1].trim();
      const nameType = parts[3].replace('\t|', '').trim();

      if (nameType === 'scientific name') {
        ncbiTaxIdToSci.set(taxId, nameTxt);
      } else if (['genbank common name', 'common name', 'blast name'].includes(nameType)) {
        if (isCleanEnglish(nameTxt)) {
          if (!ncbiTaxIdToCommon.has(taxId) || nameType === 'genbank common name') {
            ncbiTaxIdToCommon.set(taxId, formatEnglishName(nameTxt));
          }
        }
      }
    }

    for (const [taxId, common] of ncbiTaxIdToCommon) {
      const sci = ncbiTaxIdToSci.get(taxId);
      if (sci && isCleanEnglish(common) && !englishCommonNames.has(sci)) {
        englishCommonNames.set(sci, common);
      }
    }
    console.log(`  Total English names after NCBI merge: ${englishCommonNames.size.toLocaleString()}`);
  }

  // 4. Update Database
  console.log('\n── Updating PostgreSQL Database ──');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✓ Connected to PostgreSQL.');

  // Step 4a: Create a temporary staging table
  console.log('  Creating staging table for English common names...');
  await client.query(`
    CREATE TEMP TABLE tmp_english_common_names (
      scientific_name TEXT PRIMARY KEY,
      common_name TEXT NOT NULL
    );
  `);

  // Step 4b: Bulk insert into temp table in batches of 5000
  console.log('  Uploading English common names to staging table...');
  const entries = Array.from(englishCommonNames.entries());
  const batchSize = 5000;
  for (let i = 0; i < entries.length; i += batchSize) {
    const chunk = entries.slice(i, i + batchSize);
    const valuePlaceholders: string[] = [];
    const params: any[] = [];
    chunk.forEach(([sci, common], idx) => {
      valuePlaceholders.push(`($${idx * 2 + 1}, $${idx * 2 + 2})`);
      params.push(sci, common);
    });

    await client.query(
      `INSERT INTO tmp_english_common_names (scientific_name, common_name)
       VALUES ${valuePlaceholders.join(', ')}
       ON CONFLICT (scientific_name) DO UPDATE SET common_name = EXCLUDED.common_name`,
      params
    );

    if ((i + batchSize) % 25000 === 0 || i + chunk.length === entries.length) {
      console.log(`    Uploaded ${Math.min(i + chunk.length, entries.length).toLocaleString()} / ${entries.length.toLocaleString()} staging rows`);
    }
  }

  // Step 4c: Clean out non-English / foreign common names currently in the DB
  console.log('  Purging non-English common names from Species table...');
  const nonEnglishCleanRes = await client.query(`
    UPDATE "Species"
    SET "commonName" = NULL
    WHERE "commonName" IS NOT NULL
      AND ("commonName" ~ '[\\u0400-\\u04ff\\u0600-\\u06ff\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\uac00-\\ud7af\\u0e00-\\u0e7f\\u0370-\\u03ff]'
           OR "scientificName" NOT IN (SELECT scientific_name FROM tmp_english_common_names));
  `);
  console.log(`  Purged / reset ${nonEnglishCleanRes.rowCount?.toLocaleString() || 0} non-English or obsolete common name entries.`);

  // Step 4d: Update species with verified English common names from staging
  console.log('  Applying verified English common names to matching Species...');
  const updateRes = await client.query(`
    UPDATE "Species" s
    SET "commonName" = t.common_name
    FROM tmp_english_common_names t
    WHERE s."scientificName" = t.scientific_name
      AND (s."commonName" IS DISTINCT FROM t.common_name);
  `);
  console.log(`  Updated ${updateRes.rowCount?.toLocaleString() || 0} species with verified English common names!`);

  // Final Stats
  const statsRes = await client.query(`
    SELECT
      COUNT(*) AS total,
      COUNT("commonName") AS with_common,
      COUNT(*) - COUNT("commonName") AS without_common
    FROM "Species";
  `);
  const { total, with_common, without_common } = statsRes.rows[0];

  const sampleRes = await client.query(`
    SELECT "scientificName", "commonName"
    FROM "Species"
    WHERE "commonName" IS NOT NULL
    LIMIT 15;
  `);

  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║   Species English Common Names Update Complete!                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');
  console.log(`  Total species:                  ${parseInt(total).toLocaleString()}`);
  console.log(`  Species with English common:    ${parseInt(with_common).toLocaleString()}`);
  console.log(`  Species with scientific only:   ${parseInt(without_common).toLocaleString()}`);
  console.log('\nSample Updated Species:');
  console.table(sampleRes.rows);

  await client.end();
}

main().catch((err) => {
  console.error('❌ Error updating English common names:', err);
  process.exit(1);
});
