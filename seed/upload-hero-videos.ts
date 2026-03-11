/**
 * upload-hero-videos.ts
 *
 * Uploads the 3 hero videos to Sanity and patches only the heroVideos field
 * of the siteSettings document, preserving all other settings.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=<token> npx tsx upload-hero-videos.ts
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
  console.error("ERROR: SANITY_API_WRITE_TOKEN environment variable is required.");
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
  keyCounter += 1;
  return `k${keyCounter.toString(36).padStart(6, "0")}`;
}

const VIDEO_FILES = [
  { filename: "shadow_cyclist.mp4", label: "Shadow Cyclist" },
  { filename: "photographer_hero.mp4", label: "Fine Art Photographer" },
  { filename: "hands_camera.mp4", label: "Hands Adjusting Camera" },
];

async function uploadVideo(filename: string): Promise<{ _type: "reference"; _ref: string } | null> {
  const videoPath = path.join(__dirname, "media", "video", filename);
  if (!fs.existsSync(videoPath)) {
    console.warn(`  [WARN] Video not found: ${videoPath}`);
    return null;
  }
  const stat = fs.statSync(videoPath);
  const sizeMb = (stat.size / 1024 / 1024).toFixed(1);
  console.log(`  Uploading ${filename} (${sizeMb} MB)...`);
  const asset = await client.assets.upload("file", fs.createReadStream(videoPath), {
    filename,
    contentType: "video/mp4",
  });
  console.log(`  ✓ Uploaded → ${asset._id}`);
  return { _type: "reference", _ref: asset._id };
}

async function main() {
  console.log("=".repeat(60));
  console.log("Hero Videos Upload — Andreas Magdanz Portfolio");
  console.log(`Project: ${SANITY_PROJECT_ID} | Dataset: ${SANITY_DATASET}`);
  console.log("=".repeat(60));

  const heroVideos: Array<Record<string, unknown>> = [];

  for (const video of VIDEO_FILES) {
    const assetRef = await uploadVideo(video.filename);
    if (assetRef) {
      heroVideos.push({
        _key: key(),
        _type: "file",
        asset: assetRef,
      });
    }
  }

  if (heroVideos.length === 0) {
    console.error("No videos uploaded. Aborting patch.");
    process.exit(1);
  }

  console.log(`\nPatching siteSettings.heroVideos with ${heroVideos.length} video(s)...`);
  await client
    .patch("siteSettings")
    .set({ heroVideos })
    .commit();

  console.log("✓ siteSettings.heroVideos updated.");
  console.log("\nSUMMARY:");
  for (const v of VIDEO_FILES) {
    console.log(`  • ${v.label} (${v.filename})`);
  }
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
