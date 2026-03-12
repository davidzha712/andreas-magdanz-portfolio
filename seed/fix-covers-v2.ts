/**
 * fix-covers-v2.ts
 *
 * Patches cover images for the 6 main projects with real high-quality photos.
 * Uses actual project photographs instead of the 750x150 banner images.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=<token> npx tsx fix-covers-v2.ts
 */

import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SANITY_PROJECT_ID = "b8e16q3y";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "2024-01-01";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("ERROR: SANITY_API_WRITE_TOKEN is required.");
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token,
  useCdn: false,
});

let keyCounter = 0;
function key(): string {
  keyCounter++;
  return `k${keyCounter.toString(36).padStart(6, "0")}`;
}

async function uploadImage(filename: string): Promise<{ _type: "reference"; _ref: string } | null> {
  const imagePath = path.join(__dirname, "images", filename);
  if (!fs.existsSync(imagePath)) {
    console.warn(`  [SKIP] Not found: ${imagePath}`);
    return null;
  }
  const stat = fs.statSync(imagePath);
  console.log(`  Uploading ${filename} (${(stat.size / 1024).toFixed(1)} KB)...`);
  try {
    const asset = await client.assets.upload("image", fs.createReadStream(imagePath), { filename });
    console.log(`  ✓ → ${asset._id}`);
    return { _type: "reference", _ref: asset._id };
  } catch (err) {
    console.error(`  ✗ ${(err as Error).message}`);
    return null;
  }
}

// Best available real photographs for each project
// (portrait or near-square images work best in the 3:4 work grid)
const COVER_UPDATES = [
  {
    id: "project-vogelsang",
    title: "Vogelsang",
    imageFile: "vogelsang_cover_v2.jpg",   // 588×1000 portrait — book cover photo
  },
  {
    id: "project-bnd-pullach",
    title: "BND Pullach",
    imageFile: "bnd_cover_v2.jpg",          // 1400×1155 near-square — exhibition photo
  },
  {
    id: "project-auschwitz-birkenau",
    title: "Auschwitz-Birkenau",
    imageFile: "auschwitz_cover_v2.jpg",    // 800×620 landscape — project photograph
  },
  {
    id: "project-dienststelle-marienthal",
    title: "Dienststelle Marienthal",
    imageFile: "marienthal_cover_v2.jpg",   // 500×480 near-square — bunker cover
  },
  {
    id: "project-hambach-tagebau",
    title: "Hambach / Tagebau",
    imageFile: "hambach_cover_v2.jpg",      // 580×778 portrait — tree photograph
  },
  {
    id: "project-stuttgart-stammheim",
    title: "Stuttgart Stammheim",
    imageFile: "stammheim_cover_v2.jpg",    // 1200×1200 square — book cover
  },
];

async function main() {
  console.log("=".repeat(65));
  console.log("Fix Project Covers V2 — Andreas Magdanz Portfolio");
  console.log("=".repeat(65));

  let ok = 0;

  for (const item of COVER_UPDATES) {
    console.log(`\n[${item.id}] ${item.title}`);
    const assetRef = await uploadImage(item.imageFile);
    if (!assetRef) continue;

    const coverImage = {
      _type: "projectImage",
      _key: key(),
      image: { _type: "image", asset: assetRef },
      alt: `${item.title} — Cover`,
    };

    await client.patch(item.id).set({ coverImage }).commit();
    console.log(`  ✓ coverImage updated`);
    ok++;
  }

  console.log("\n" + "=".repeat(65));
  console.log(`DONE: ${ok}/${COVER_UPDATES.length} projects updated`);
  console.log("=".repeat(65));
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
