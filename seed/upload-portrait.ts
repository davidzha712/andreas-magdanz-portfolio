/**
 * upload-portrait.ts
 *
 * Uploads the artist portrait photo and sets it as artistPortrait in siteSettings.
 *
 * Usage:
 *   1. Save the portrait image as seed/images/portrait.jpg
 *   2. SANITY_API_WRITE_TOKEN=<token> npx tsx upload-portrait.ts
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

async function main() {
  console.log("=".repeat(60));
  console.log("Upload Artist Portrait — Andreas Magdanz Portfolio");
  console.log("=".repeat(60));

  const imagePath = path.join(__dirname, "images", "portrait.jpg");
  if (!fs.existsSync(imagePath)) {
    console.error(`ERROR: Image not found at ${imagePath}`);
    console.error("Please save the portrait image as seed/images/portrait.jpg");
    process.exit(1);
  }

  const stat = fs.statSync(imagePath);
  console.log(`\nUploading portrait.jpg (${(stat.size / 1024).toFixed(1)} KB)...`);

  const asset = await client.assets.upload(
    "image",
    fs.createReadStream(imagePath),
    { filename: "portrait.jpg" }
  );
  console.log(`✓ Uploaded → ${asset._id}`);

  await client.patch("siteSettings").set({
    artistPortrait: {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
      hotspot: { x: 0.5, y: 0.3, height: 0.6, width: 0.6 },
      crop: { top: 0, bottom: 0, left: 0, right: 0 },
    },
  }).commit();

  console.log("✓ siteSettings.artistPortrait updated");
  console.log("=".repeat(60));
  console.log("Done. The portrait will appear on the About and CV pages.");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
