import bcrypt from "bcrypt";
import { PrismaClient, Prisma } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const adminData: Prisma.AdminCreateInput[] = [
  {
    email: "kushkumar.officialsoftwaredev@gmail.com",
    password: "1234", // Will be replaced by hashed password
    fullName: "Welcona Admin",
  },
  {
    email: "deekpakjain.admin@welcona.com",
    password: "7gvgvKkrVDHldtQi1UQ3dVEgfW5fSdzmg/nbqbOWcDs=",
    fullName: "Welcona Admin",
  }
];

const categories = [
  {
    name: "Basin Mixers",
    description: "Deck and wall-mounted mixers for modern vanity spaces.",
  },
  {
    name: "Shower Systems",
    description: "Rain showers, thermostat sets, and exposed systems.",
  },
  {
    name: "Hand Showers & Health Faucets",
    description: "Compact spray sets with clean detailing and easy servicing.",
  },
  {
    name: "Bathroom Accessories",
    description: "Daily-use rails, hooks, holders, and shelves.",
  },
  {
    name: "Concealed Systems & Drains",
    description: "Flush plates, concealed kits, traps, and drainware.",
  },
];

const imageLibrary = {
  basin: [
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
  ],
  shower: [
    "https://images.unsplash.com/photo-1629079447777-1e605162dc8d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1628605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1616594039964-3fc0ae44f925?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&w=1200&q=80",
  ],
  hand: [
    "https://images.unsplash.com/photo-1628745277862-bc0e98f7e70d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1604709177225-055f99402ea3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1628605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=80",
  ],
  accessory: [
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
  ],
  concealed: [
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1629079447777-1e605162dc8d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
  ],
};

type SeedProduct = {
  sku: string;
  name: string;
  categoryName: string;
  quantity: number;
  retailPrice: number;
  discount?: number;
  wholesalePrice?: number;
  wholesaleMinQuantity?: number;
  description: string;
  warranty: string;
  finish: string;
  material: string;
  tags: string[];
  images: {
    image: string;
    detail: string;
    isPrimary?: boolean;
  }[];
};

function buildImages(urls: string[], details: string[]) {
  return urls.slice(0, details.length).map((image, index) => ({
    image,
    detail: details[index],
    isPrimary: index === 0,
  }));
}

const productData: SeedProduct[] = [
  {
    sku: "WEL-BM-001",
    name: "Aurum Basin Mixer",
    categoryName: "Basin Mixers",
    quantity: 18,
    retailPrice: 18990,
    discount: 10,
    wholesalePrice: 13990,
    wholesaleMinQuantity: 5,
    description: "A soft-edged brass basin mixer with a tall body profile and smooth cartridge action for premium vanity counters.",
    warranty: "7 years",
    finish: "Brushed Gold",
    material: "Solid brass",
    tags: ["basin mixer", "premium", "deck mount", "hotel"],
    images: buildImages(imageLibrary.basin, ["Primary front angle", "Handle and spout detail", "Installed vanity view"]),
  },
  {
    sku: "WEL-BM-002",
    name: "Cascade Tall Mixer",
    categoryName: "Basin Mixers",
    quantity: 14,
    retailPrice: 21490,
    discount: 12,
    wholesalePrice: 15490,
    wholesaleMinQuantity: 3,
    description: "Tall deck-mounted mixer designed for vessel basins with a slim silhouette and crisp water projection.",
    warranty: "7 years",
    finish: "Matte Black",
    material: "Solid brass",
    tags: ["vessel basin", "tall mixer", "matte black", "modern"],
    images: buildImages([imageLibrary.basin[1], imageLibrary.basin[3], imageLibrary.basin[0]], ["Tall profile front view", "Finish and handle texture", "Styled basin installation"]),
  },
  {
    sku: "WEL-BM-003",
    name: "Meridian Wall Mixer",
    categoryName: "Basin Mixers",
    quantity: 20,
    retailPrice: 17650,
    wholesalePrice: 12500,
    wholesaleMinQuantity: 10,
    description: "Wall-mounted basin mixer for clutter-free countertops and a minimal architectural look.",
    warranty: "5 years",
    finish: "Chrome",
    material: "Brass",
    tags: ["wall mixer", "chrome", "minimal", "architectural"],
    images: buildImages([imageLibrary.basin[2], imageLibrary.basin[0], imageLibrary.basin[1]], ["Wall mixer profile", "Water flow shot", "Countertop styling"]),
  },
  {
    sku: "WEL-BM-004",
    name: "Orbit Sensor Mixer",
    categoryName: "Basin Mixers",
    quantity: 11,
    retailPrice: 24990,
    discount: 8,
    description: "Touch-free basin mixer suited for hospitality and commercial washrooms where hygiene is a priority.",
    warranty: "5 years",
    finish: "Satin Steel",
    material: "Brass and steel",
    tags: ["sensor", "touch free", "commercial", "hygiene"],
    images: buildImages([imageLibrary.basin[3], imageLibrary.basin[2], imageLibrary.basin[1]], ["Sensor front view", "Neck and spout detail", "Counter installation"]),
  },
  {
    sku: "WEL-SS-001",
    name: "Monsoon Rain Shower Set",
    categoryName: "Shower Systems",
    quantity: 16,
    retailPrice: 32990,
    discount: 15,
    description: "Rain shower system with overhead shower, hand shower, diverter, and exposed trim for feature bathrooms.",
    warranty: "7 years",
    finish: "Chrome",
    material: "Brass and stainless steel",
    tags: ["rain shower", "complete set", "chrome", "luxury"],
    images: buildImages(imageLibrary.shower, ["Complete shower system", "Overhead shower detail", "Installed shower environment", "Control trim close-up"]),
  },
  {
    sku: "WEL-SS-002",
    name: "Atlas Thermostatic Column",
    categoryName: "Shower Systems",
    quantity: 9,
    retailPrice: 38990,
    discount: 10,
    description: "Thermostatic shower column with wide rain head and precise temperature control for premium projects.",
    warranty: "7 years",
    finish: "Brushed Nickel",
    material: "Brass",
    tags: ["thermostatic", "column", "premium", "nickel"],
    images: buildImages([imageLibrary.shower[1], imageLibrary.shower[0], imageLibrary.shower[2]], ["Column set front view", "Rain head detail", "Luxury bathroom install"]),
  },
  {
    sku: "WEL-SS-003",
    name: "Drift Ceiling Shower Arm Set",
    categoryName: "Shower Systems",
    quantity: 12,
    retailPrice: 27990,
    description: "Ceiling-mounted shower arm set created for clean vertical lines and open shower enclosures.",
    warranty: "5 years",
    finish: "Matte Black",
    material: "Stainless steel",
    tags: ["ceiling shower", "matte black", "minimal", "rain head"],
    images: buildImages([imageLibrary.shower[2], imageLibrary.shower[3], imageLibrary.shower[0]], ["Ceiling mount profile", "Arm and plate detail", "Installed shower frame"]),
  },
  {
    sku: "WEL-SS-004",
    name: "Vero Round Overhead Kit",
    categoryName: "Shower Systems",
    quantity: 15,
    retailPrice: 23650,
    discount: 6,
    description: "Round overhead shower kit with exposed trim and balanced spray coverage for daily comfort.",
    warranty: "5 years",
    finish: "Rose Gold",
    material: "Brass",
    tags: ["overhead shower", "rose gold", "round", "spa"],
    images: buildImages([imageLibrary.shower[3], imageLibrary.shower[0], imageLibrary.shower[1]], ["Overhead kit front angle", "Finish close-up", "Bathroom ambience shot"]),
  },
  {
    sku: "WEL-HF-001",
    name: "Halo Hand Shower Kit",
    categoryName: "Hand Showers & Health Faucets",
    quantity: 28,
    retailPrice: 6490,
    description: "Compact hand shower kit with hose, wall hook, and smooth spray control for flexible bathing zones.",
    warranty: "3 years",
    finish: "Chrome",
    material: "ABS and brass",
    tags: ["hand shower", "chrome", "compact", "easy clean"],
    images: buildImages(imageLibrary.hand, ["Kit overview", "Handset grip detail", "Wall-mounted styling", "Spray head close-up"]),
  },
  {
    sku: "WEL-HF-002",
    name: "Core Health Faucet Set",
    categoryName: "Hand Showers & Health Faucets",
    quantity: 34,
    retailPrice: 4290,
    discount: 7,
    description: "Health faucet set with braided hose and compact trigger body designed for daily use and easy servicing.",
    warranty: "3 years",
    finish: "Brushed Steel",
    material: "Stainless steel",
    tags: ["health faucet", "steel", "washroom", "utility"],
    images: buildImages([imageLibrary.hand[1], imageLibrary.hand[0], imageLibrary.hand[3]], ["Set front view", "Nozzle and trigger detail", "Installed washroom view"]),
  },
  {
    sku: "WEL-HF-003",
    name: "Sora Multi-Spray Hand Shower",
    categoryName: "Hand Showers & Health Faucets",
    quantity: 17,
    retailPrice: 7990,
    discount: 9,
    description: "Multi-spray handset with ergonomic form and balanced weight for premium shower upgrades.",
    warranty: "5 years",
    finish: "Gunmetal",
    material: "ABS and brass",
    tags: ["multi spray", "gunmetal", "premium shower", "ergonomic"],
    images: buildImages([imageLibrary.hand[2], imageLibrary.hand[3], imageLibrary.hand[0]], ["Hand shower hero shot", "Spray face detail", "Installed use case"]),
  },
  {
    sku: "WEL-HF-004",
    name: "Axis Spray Duo",
    categoryName: "Hand Showers & Health Faucets",
    quantity: 22,
    retailPrice: 5890,
    description: "Two-piece spray duo with compact wall outlet and smooth hose management.",
    warranty: "3 years",
    finish: "Matte Black",
    material: "ABS",
    tags: ["spray duo", "black", "compact", "contemporary"],
    images: buildImages([imageLibrary.hand[3], imageLibrary.hand[1], imageLibrary.hand[2]], ["Duo set front view", "Wall outlet detail", "Styled washroom scene"]),
  },
  {
    sku: "WEL-AC-001",
    name: "Pebble Towel Ring",
    categoryName: "Bathroom Accessories",
    quantity: 40,
    retailPrice: 2690,
    description: "Rounded towel ring with concealed fixings and a compact profile suited for contemporary bathrooms.",
    warranty: "2 years",
    finish: "Chrome",
    material: "Brass",
    tags: ["towel ring", "accessory", "chrome", "wall mount"],
    images: buildImages(imageLibrary.accessory, ["Installed ring overview", "Rounded form detail", "Accessory in styled bathroom", "Mounting view"]),
  },
  {
    sku: "WEL-AC-002",
    name: "Lattice Towel Rail",
    categoryName: "Bathroom Accessories",
    quantity: 25,
    retailPrice: 4590,
    discount: 5,
    description: "Long-form towel rail with crisp edges and concealed mounting hardware.",
    warranty: "2 years",
    finish: "Brushed Nickel",
    material: "Stainless steel",
    tags: ["towel rail", "nickel", "linear", "premium accessory"],
    images: buildImages([imageLibrary.accessory[1], imageLibrary.accessory[0], imageLibrary.accessory[3]], ["Rail front view", "Fixing detail", "Bathroom installation"]),
  },
  {
    sku: "WEL-AC-003",
    name: "Slate Robe Hook",
    categoryName: "Bathroom Accessories",
    quantity: 50,
    retailPrice: 1490,
    description: "Minimal single robe hook with a compact footprint and smooth edge detailing.",
    warranty: "2 years",
    finish: "Matte Black",
    material: "Zinc alloy",
    tags: ["robe hook", "minimal", "black", "compact"],
    images: buildImages([imageLibrary.accessory[2], imageLibrary.accessory[3], imageLibrary.accessory[0]], ["Hook installation", "Texture detail", "Accessory grouping"]),
  },
  {
    sku: "WEL-AC-004",
    name: "Aura Soap Shelf Combo",
    categoryName: "Bathroom Accessories",
    quantity: 19,
    retailPrice: 3890,
    description: "Soap holder and shelf combo for shower enclosures where compact storage matters.",
    warranty: "2 years",
    finish: "Rose Gold",
    material: "Stainless steel",
    tags: ["soap shelf", "rose gold", "storage", "shower accessory"],
    images: buildImages([imageLibrary.accessory[3], imageLibrary.accessory[1], imageLibrary.accessory[2]], ["Shelf combo overview", "Finish and edge detail", "Installed shower setting"]),
  },
  {
    sku: "WEL-CS-001",
    name: "Crest Flush Plate System",
    categoryName: "Concealed Systems & Drains",
    quantity: 21,
    retailPrice: 9190,
    description: "Flush plate system with a clean rectangular interface designed for concealed cistern setups.",
    warranty: "5 years",
    finish: "Champagne",
    material: "ABS and steel",
    tags: ["flush plate", "concealed", "cistern", "dual flush"],
    images: buildImages(imageLibrary.concealed, ["Flush plate front view", "Button detail", "Installed wall finish", "System styling"]),
  },
  {
    sku: "WEL-CS-002",
    name: "Flux Concealed Cistern Kit",
    categoryName: "Concealed Systems & Drains",
    quantity: 13,
    retailPrice: 16990,
    discount: 11,
    description: "Concealed cistern kit for wall-hung setups with reliable internals and quiet refilling.",
    warranty: "7 years",
    finish: "Blue frame",
    material: "HDPE and steel",
    tags: ["cistern kit", "wall hung", "concealed", "project supply"],
    images: buildImages([imageLibrary.concealed[1], imageLibrary.concealed[0], imageLibrary.concealed[2]], ["Cistern kit overview", "Frame and service access detail", "Installed washroom mockup"]),
  },
  {
    sku: "WEL-CS-003",
    name: "Prism Floor Drain",
    categoryName: "Concealed Systems & Drains",
    quantity: 46,
    retailPrice: 2490,
    description: "Linear-style floor drain with removable grate and easy-clean trap design.",
    warranty: "3 years",
    finish: "Stainless Steel",
    material: "SS304",
    tags: ["floor drain", "linear", "ss304", "wet area"],
    images: buildImages([imageLibrary.concealed[2], imageLibrary.concealed[3], imageLibrary.concealed[1]], ["Drain cover front view", "Grate detail", "Floor installation shot"]),
  },
  {
    sku: "WEL-CS-004",
    name: "Nova Bottle Trap",
    categoryName: "Concealed Systems & Drains",
    quantity: 27,
    retailPrice: 3390,
    description: "Decorative bottle trap for open vanity installations where under-counter detailing stays visible.",
    warranty: "3 years",
    finish: "Chrome",
    material: "Brass",
    tags: ["bottle trap", "vanity", "chrome", "plumbing trim"],
    images: buildImages([imageLibrary.concealed[3], imageLibrary.concealed[2], imageLibrary.concealed[0]], ["Bottle trap overview", "Pipe and cup detail", "Open vanity installation"]),
  },
];

export async function main() {
  for (const admin of adminData) {
    const hashedPassword = await bcrypt.hash(admin.password, 12);
    await prisma.admin.upsert({
      where: { email: admin.email },
      update: {
        password: hashedPassword,
        fullName: admin.fullName ?? null,
      },
      create: {
        ...admin,
        password: hashedPassword,
      },
    });
  }

  const categoryRecords = await Promise.all(
    categories.map(async (category) => {
      const existingCategory = await prisma.category.findFirst({
        where: { name: category.name },
      });

      if (existingCategory) {
        return prisma.category.update({
          where: { id: existingCategory.id },
          data: {
            description: category.description,
          },
        });
      }

      return prisma.category.create({
        data: category,
      });
    })
  );

  const categoryMap = new Map(categoryRecords.map((category) => [category.name, category.id]));

  for (const product of productData) {
    const categoryId = categoryMap.get(product.categoryName);

    if (!categoryId) {
      throw new Error(`Category not found for product ${product.sku}`);
    }

    const images = product.images.map((image, index) => ({
      image: image.image,
      detail: image.detail,
      isPrimary: Boolean(image.isPrimary),
      index,
    }));

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        quantity: product.quantity,
        retailPrice: product.retailPrice,
        discount: product.discount ?? null,
        wholesalePrice: product.wholesalePrice ?? null,
        wholesaleMinQuantity: product.wholesaleMinQuantity ?? 1,
        description: product.description,
        warranty: product.warranty,
        finish: product.finish,
        material: product.material,
        tags: product.tags,
        categoryId,
        images: {
          deleteMany: {},
          create: images,
        },
      },
      create: {
        sku: product.sku,
        name: product.name,
        quantity: product.quantity,
        retailPrice: product.retailPrice,
        discount: product.discount ?? null,
        wholesalePrice: product.wholesalePrice ?? null,
        wholesaleMinQuantity: product.wholesaleMinQuantity ?? 1,
        description: product.description,
        warranty: product.warranty,
        finish: product.finish,
        material: product.material,
        tags: product.tags,
        category: {
          connect: { id: categoryId },
        },
        images: {
          create: images,
        },
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${productData.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
