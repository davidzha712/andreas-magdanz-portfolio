import { createClient, type SanityClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SANITY_PROJECT_ID = "b8e16q3y";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "2024-01-01";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("ERROR: SANITY_API_WRITE_TOKEN environment variable is required.");
  process.exit(1);
}

const client: SanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token,
  useCdn: false,
});

const SCRAPED_DIR = path.join(__dirname, "images", "scraped");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let keyCounter = 0;
function key(): string {
  keyCounter += 1;
  return `img${keyCounter.toString(36).padStart(5, "0")}`;
}

/** Upload an image file to Sanity and return an asset reference. */
async function uploadImage(
  filename: string,
): Promise<{ _type: "reference"; _ref: string } | null> {
  const imagePath = path.join(SCRAPED_DIR, filename);
  if (!fs.existsSync(imagePath)) {
    console.warn(`  [WARN] Image not found: ${imagePath}`);
    return null;
  }
  try {
    const asset = await client.assets.upload(
      "image",
      fs.createReadStream(imagePath),
      { filename },
    );
    return { _type: "reference", _ref: asset._id };
  } catch (err) {
    console.warn(`  [WARN] Failed to upload ${filename}:`, (err as Error).message);
    return null;
  }
}

/** Build a projectImage object matching the Sanity schema. */
function makeProjectImage(
  assetRef: { _type: "reference"; _ref: string },
  alt: string,
  caption?: string,
): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    _type: "projectImage",
    _key: key(),
    image: {
      _type: "image",
      asset: assetRef,
    },
    alt,
  };
  if (caption) obj.caption = caption;
  return obj;
}

/** Derive a human-readable alt text from a filename. */
function filenameToAlt(filename: string, projectTitle: string): string {
  const base = path.basename(filename, path.extname(filename));
  // Remove the project prefix and clean up
  const cleaned = base
    .replace(/^(auschwitz|vogelsang|garzweiler|bnd)_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `${projectTitle} - ${cleaned}`;
}

/** Natural sort for filenames with numbers (e.g., big_1, big_2, ..., big_10). */
function naturalSort(a: string, b: string): number {
  const re = /(\d+)/g;
  const aParts = a.split(re);
  const bParts = b.split(re);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    if (i >= aParts.length) return -1;
    if (i >= bParts.length) return 1;
    const aVal = aParts[i];
    const bVal = bParts[i];
    // If both parts are numeric, compare as numbers
    if (/^\d+$/.test(aVal) && /^\d+$/.test(bVal)) {
      const diff = parseInt(aVal, 10) - parseInt(bVal, 10);
      if (diff !== 0) return diff;
    } else {
      const cmp = aVal.localeCompare(bVal);
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Image-to-project mapping
// ---------------------------------------------------------------------------

interface ProjectMapping {
  projectId: string;
  projectTitle: string;
  slug: string;
  /** Predicate: does this scraped filename belong to this project's gallery? */
  matchGallery: (filename: string) => boolean;
  /** Predicate: is this a header/cover image for this project? */
  matchHeader: (filename: string) => boolean;
}

const PROJECT_MAPPINGS: ProjectMapping[] = [
  {
    projectId: "project-auschwitz-birkenau",
    projectTitle: "Auschwitz-Birkenau",
    slug: "auschwitz-birkenau",
    matchGallery: (f) =>
      f.startsWith("auschwitz_big_") ||
      f.startsWith("auschwitz_auschwitz"),
    matchHeader: (f) =>
      f === "header_auschwitz_750.jpg",
  },
  {
    projectId: "project-vogelsang",
    projectTitle: "Vogelsang",
    slug: "vogelsang",
    matchGallery: (f) =>
      f.startsWith("vogelsang_big_") ||
      f === "vogelsang_krypta.jpg" ||
      f === "vogelsang_minidra.jpg",
    matchHeader: (f) =>
      f === "header_vogelsang_750.jpg",
  },
  {
    projectId: "project-hambach-tagebau",
    projectTitle: "Hambach / Tagebau",
    slug: "hambach-tagebau",
    matchGallery: (f) =>
      f.startsWith("garzweiler_zeitung_") ||
      f.startsWith("garzweiler_buche_") ||
      f === "garzweiler_altefrau_otzenrath_1995.jpg" ||
      f === "garzweiler_garzweilerallee_1995.jpg",
    matchHeader: (f) =>
      f === "header_garzweiler_750.jpg",
  },
  {
    projectId: "project-bnd-pullach",
    projectTitle: "BND - Standort Pullach",
    slug: "bnd-standort-pullach",
    matchGallery: (f) =>
      f.startsWith("bnd_bnd"),
    matchHeader: (f) =>
      f === "header_bnd_750.jpg",
  },
  {
    projectId: "project-stuttgart-stammheim",
    projectTitle: "Stuttgart Stammheim",
    slug: "stuttgart-stammheim",
    matchGallery: () => false,
    matchHeader: (f) =>
      f === "header_stammheim_750.jpg",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Seed Images: Upload scraped images to Sanity ===\n");

  // Read all files from scraped directory
  const allFiles = fs
    .readdirSync(SCRAPED_DIR)
    .filter((f) => f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".png"))
    .filter((f) => !f.startsWith("teaser_") && !f.startsWith("temp_"));

  console.log(`Found ${allFiles.length} images (after excluding teaser/temp)\n`);

  // Fetch existing projects for reference
  const existingProjects = await client.fetch<
    Array<{
      _id: string;
      slug: string;
      imageCount: number;
      coverAsset: string | null;
    }>
  >(
    `*[_type == "project"]{
      _id,
      "slug": slug.current,
      "imageCount": count(images),
      "coverAsset": coverImage.image.asset._ref
    }`,
  );
  console.log(`Found ${existingProjects.length} existing projects in Sanity\n`);

  // The placeholder cover image used by seed.ts when no real cover was available
  const PLACEHOLDER_ASSET = "image-0851bdc48b3460e00ec5099087a70e25db2dbbe1-200x150-jpg";

  // Track which files were handled
  const handledFiles = new Set<string>();

  for (const mapping of PROJECT_MAPPINGS) {
    console.log(`\n--- ${mapping.projectTitle} (${mapping.slug}) ---`);

    const project = existingProjects.find((p) => p._id === mapping.projectId);
    if (!project) {
      console.log(`  [SKIP] Project "${mapping.projectTitle}" not found in Sanity`);
      continue;
    }

    // 1. Collect gallery images for this project
    const galleryFiles = allFiles
      .filter((f) => mapping.matchGallery(f))
      .sort(naturalSort);

    // 2. Collect header images for this project
    const headerFiles = allFiles.filter((f) => mapping.matchHeader(f));

    console.log(
      `  Gallery images: ${galleryFiles.length}, Header images: ${headerFiles.length}`,
    );

    // Mark files as handled
    for (const f of galleryFiles) handledFiles.add(f);
    for (const f of headerFiles) handledFiles.add(f);

    // 3. Upload header image and optionally set as coverImage
    for (const headerFile of headerFiles) {
      console.log(`  Uploading header: ${headerFile}...`);
      const ref = await uploadImage(headerFile);
      if (!ref) continue;

      // Set as coverImage if current cover is the placeholder
      const isPlaceholder = project.coverAsset === PLACEHOLDER_ASSET;
      if (isPlaceholder) {
        const coverObj = makeProjectImage(
          ref,
          `${mapping.projectTitle} - Cover`,
        );
        await client.patch(mapping.projectId).set({ coverImage: coverObj }).commit();
        console.log(`  -> Set as coverImage (replaced placeholder)`);
      } else {
        console.log(`  -> Project already has a real cover image, skipping cover update`);
      }
    }

    // 4. Upload gallery images and append to images array
    if (galleryFiles.length === 0) {
      console.log("  No gallery images to upload.");
      continue;
    }

    const projectImages: Array<Record<string, unknown>> = [];

    for (const file of galleryFiles) {
      console.log(`  Uploading: ${file}...`);
      const ref = await uploadImage(file);
      if (!ref) continue;

      const alt = filenameToAlt(file, mapping.projectTitle);
      projectImages.push(makeProjectImage(ref, alt));
    }

    if (projectImages.length > 0) {
      // Append to existing images array (don't replace)
      await client
        .patch(mapping.projectId)
        .setIfMissing({ images: [] })
        .append("images", projectImages)
        .commit();
      console.log(
        `  -> Appended ${projectImages.length} images to ${mapping.projectTitle}`,
      );
    }
  }

  // Report unhandled files
  const unhandled = allFiles.filter((f) => !handledFiles.has(f));
  if (unhandled.length > 0) {
    console.log(`\n--- Unhandled files (${unhandled.length}) ---`);
    for (const f of unhandled) {
      console.log(`  ${f}`);
    }
  }

  console.log("\n=== Done! ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
