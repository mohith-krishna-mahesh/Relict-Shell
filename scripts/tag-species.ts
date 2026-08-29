import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Curated lists of scientific names for each tag
const endangeredSpecies = [
  'Panthera tigris', // Tiger
  'Ailuropoda melanoleuca', // Giant Panda
  'Gorilla beringei', // Eastern Gorilla
  'Diceros bicornis', // Black Rhinoceros
  'Elephas maximus', // Asian Elephant
  'Pongo pygmaeus', // Bornean Orangutan
  'Panthera leo', // Lion
  'Balaenoptera musculus', // Blue Whale
  'Rhincodon typus', // Whale Shark
  'Caretta caretta', // Loggerhead Sea Turtle
  'Eretmochelys imbricata', // Hawksbill Sea Turtle
  'Dermochelys coriacea', // Leatherback Sea Turtle
  'Acinonyx jubatus', // Cheetah
  'Panthera onca', // Jaguar
  'Pteronura brasiliensis', // Giant Otter
  'Eubalaena glacialis', // North Atlantic Right Whale
  'Gopherus agassizii', // Desert Tortoise
  'Gymnogyps californianus', // California Condor
  'Ambystoma mexicanum', // Axolotl
  'Spheniscus galapagoensis', // Galapagos Penguin
  'Iguana delicatissima', // Lesser Antillean Iguana
  'Hippopotamus amphibius', // Hippopotamus
  'Loxodonta africana', // African Bush Elephant
  'Gorilla gorilla', // Western Gorilla
  'Pongo abelii', // Sumatran Orangutan
  'Pongo tapanuliensis', // Tapanuli Orangutan
  'Rhinoceros unicornis', // Indian Rhinoceros
  'Rhinoceros sondaicus', // Javan Rhinoceros
  'Dicerorhinus sumatrensis', // Sumatran Rhinoceros
  'Panthera pardus', // Leopard
  'Panthera uncia', // Snow Leopard
  'Varecia variegata', // Black-and-white Ruffed Lemur
  'Lemur catta' // Ring-tailed Lemur
];

const cropSpecies = [
  'Oryza sativa', // Rice
  'Zea mays', // Maize/Corn
  'Triticum aestivum', // Wheat
  'Glycine max', // Soybean
  'Solanum tuberosum', // Potato
  'Saccharum officinarum', // Sugarcane
  'Ipomoea batatas', // Sweet Potato
  'Manihot esculenta', // Cassava
  'Solanum lycopersicum', // Tomato
  'Musa acuminata', // Banana
  'Musa balbisiana', // Banana
  'Brassica oleracea', // Cabbage, Broccoli, etc.
  'Allium cepa', // Onion
  'Malus domestica', // Apple
  'Citrus sinensis', // Sweet Orange
  'Vitis vinifera', // Grape
  'Arachis hypogaea', // Peanut
  'Gossypium hirsutum', // Cotton
  'Phaseolus vulgaris', // Common Bean
  'Coffea arabica', // Coffee
  'Theobroma cacao', // Cocoa
  'Camellia sinensis', // Tea
  'Nicotiana tabacum', // Tobacco
  'Helianthus annuus', // Sunflower
  'Beta vulgaris', // Sugar Beet
  'Hordeum vulgare' // Barley
];

const livestockSpecies = [
  'Bos taurus', // Cattle
  'Bos indicus', // Zebu
  'Sus domesticus', // Pig
  'Sus scrofa', // Wild boar / Pig
  'Ovis aries', // Sheep
  'Capra hircus', // Goat
  'Capra aegagrus', // Wild goat
  'Gallus gallus', // Chicken
  'Meleagris gallopavo', // Turkey
  'Anas platyrhynchos', // Duck
  'Anser anser', // Goose
  'Equus caballus', // Horse
  'Equus asinus', // Donkey
  'Bubalus bubalis', // Water Buffalo
  'Camelus dromedarius', // Dromedary Camel
  'Camelus bactrianus', // Bactrian Camel
  'Lama glama', // Llama
  'Vicugna pacos', // Alpaca
  'Cavia porcellus' // Guinea Pig
];

const invasiveSpecies = [
  'Rhinella marina', // Cane Toad
  'Lissachatina fulica', // Giant African Land Snail
  'Achatina fulica', // Giant African Land Snail (synonym)
  'Sturnus vulgaris', // Common Starling
  'Vulpes vulpes', // Red Fox
  'Felis catus', // Domestic Cat (feral)
  'Pueraria montana', // Kudzu
  'Eichhornia crassipes', // Water Hyacinth
  'Lantana camara', // Lantana
  'Reynoutria japonica', // Japanese Knotweed
  'Fallopia japonica', // Japanese Knotweed (synonym)
  'Coptotermes formosanus', // Formosan Subterranean Termite
  'Aedes albopictus', // Asian Tiger Mosquito
  'Dreissena polymorpha', // Zebra Mussel
  'Asterias amurensis', // Northern Pacific Seastar
  'Mnemiopsis leidyi', // Sea Walnut
  'Cyprinus carpio', // Common Carp
  'Lates niloticus', // Nile Perch
  'Herpestes javanicus' // Small Asian Mongoose
];

const diseaseVectorSpecies = [
  'Aedes aegypti', // Yellow fever mosquito
  'Aedes albopictus', // Asian tiger mosquito
  'Anopheles gambiae', // Malaria mosquito
  'Anopheles stephensi', // Malaria mosquito
  'Culex pipiens', // Common house mosquito
  'Culex quinquefasciatus', // Southern house mosquito
  'Ixodes scapularis', // Black-legged tick
  'Ixodes ricinus', // Castor bean tick
  'Phlebotomus papatasi', // Sandfly
  'Glossina morsitans', // Tsetse fly
  'Triatoma infestans', // Kissing bug
  'Pediculus humanus', // Human louse
  'Xenopsylla cheopis' // Oriental rat flea
];

const chassisSpecies = [
  'Escherichia coli', // E. coli
  'Saccharomyces cerevisiae', // Baker's yeast
  'Bacillus subtilis', // B. subtilis
  'Pseudomonas putida', // P. putida
  'Corynebacterium glutamicum', // C. glutamicum
  'Streptomyces coelicolor', // S. coelicolor
  'Lactococcus lactis', // L. lactis
  'Yarrowia lipolytica', // Y. lipolytica
  'Pichia pastoris', // P. pastoris
  'Komagataella phaffii', // K. phaffii (synonym)
  'Synechocystis sp.', // Cyanobacterium
  'Aspergillus niger', // A. niger
  'Mycoplasma mycoides', // M. mycoides
  'Clostridium autoethanogenum', // Gas fermenter
  'Vibrio natriegens', // V. natriegens
  'Rhodobacter sphaeroides', // R. sphaeroides
  'Schizosaccharomyces pombe' // Fission yeast
];

const tagLists: Record<string, string[]> = {
  'endangered': endangeredSpecies,
  'crop': cropSpecies,
  'livestock': livestockSpecies,
  'invasive': invasiveSpecies,
  'disease-vector': diseaseVectorSpecies,
  'chassis': chassisSpecies
};

async function main() {
  console.log('Starting species tagging process...\n');

  for (const [tag, speciesList] of Object.entries(tagLists)) {
    console.log(`Processing tag: [${tag}] (${speciesList.length} species in curated list)`);

    // Check which species actually exist in the DB to report progress
    const existingSpecies = await prisma.species.findMany({
      where: {
        scientificName: {
          in: speciesList
        }
      },
      select: {
        scientificName: true
      }
    });

    console.log(`  Found ${existingSpecies.length} matching species in the database.`);

    if (existingSpecies.length > 0) {
      // Apply the tags using array operations for efficiency
      const result = await prisma.$executeRawUnsafe(
        `UPDATE "Species" SET tags = array_append(tags, '${tag}') WHERE "scientificName" = ANY($1) AND NOT ('${tag}' = ANY(tags))`,
        speciesList
      );

      console.log(`  Successfully added tag '${tag}' to ${result} records.\n`);
    } else {
      console.log(`  No updates needed for tag '${tag}'.\n`);
    }
  }

  console.log('Species tagging process completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during species tagging:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
