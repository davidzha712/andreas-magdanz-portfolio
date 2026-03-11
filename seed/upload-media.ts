/**
 * upload-media.ts
 *
 * Uploads all media files (MP4 video, MP3 audio) to Sanity CDN and patches
 * each mediaItem document to use the new HTTPS CDN URLs.
 * Also sets siteSettings.heroImage from site_header.jpg.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=<token> npx tsx upload-media.ts
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

// Extract filename from old-site embed URL
// e.g. "http://www.andreasmagdanz.de/index.php?id=6002&media=3sat_kuz.mp4" → "3sat_kuz.mp4"
function extractFilename(url: string): string | null {
  const match = url.match(/[?&]media=([^&]+\.(mp4|mp3))/i);
  return match ? match[1] : null;
}

function isOldSiteUrl(url: string): boolean {
  return /andreasmagdanz\.de\/index\.php/.test(url);
}

async function uploadFile(
  filePath: string,
  filename: string,
  contentType: string,
): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    console.warn(`  [SKIP] Not found: ${filePath}`);
    return null;
  }
  const stat = fs.statSync(filePath);
  const sizeMb = (stat.size / 1024 / 1024).toFixed(1);
  console.log(`  Uploading ${filename} (${sizeMb} MB)...`);
  try {
    const asset = await client.assets.upload(
      "file",
      fs.createReadStream(filePath),
      { filename, contentType },
    );
    console.log(`  ✓ ${filename} → ${asset.url}`);
    return asset.url;
  } catch (err) {
    console.error(`  ✗ Failed: ${filename}`, (err as Error).message);
    return null;
  }
}

async function uploadImage(
  filePath: string,
  filename: string,
): Promise<{ _type: "reference"; _ref: string } | null> {
  if (!fs.existsSync(filePath)) {
    console.warn(`  [SKIP] Image not found: ${filePath}`);
    return null;
  }
  const stat = fs.statSync(filePath);
  const sizeMb = (stat.size / 1024 / 1024).toFixed(1);
  console.log(`  Uploading image ${filename} (${sizeMb} MB)...`);
  try {
    const asset = await client.assets.upload(
      "image",
      fs.createReadStream(filePath),
      { filename },
    );
    console.log(`  ✓ ${filename} → ${asset._id}`);
    return { _type: "reference", _ref: asset._id };
  } catch (err) {
    console.error(`  ✗ Failed: ${filename}`, (err as Error).message);
    return null;
  }
}

async function main() {
  console.log("=".repeat(65));
  console.log("Media Upload — Andreas Magdanz Portfolio");
  console.log(`Project: ${SANITY_PROJECT_ID} | Dataset: ${SANITY_DATASET}`);
  console.log("=".repeat(65));

  // ─── Step 1: Build filename → CDN URL maps ───────────────────────────────

  console.log("\n[1/4] Uploading MP4 video files...");
  const videoDir = path.join(__dirname, "media", "video");
  const videoFiles = fs.readdirSync(videoDir).filter((f) => f.endsWith(".mp4"));
  const videoUrlMap = new Map<string, string>();

  for (const filename of videoFiles) {
    const filePath = path.join(videoDir, filename);
    const cdnUrl = await uploadFile(filePath, filename, "video/mp4");
    if (cdnUrl) videoUrlMap.set(filename, cdnUrl);
  }
  console.log(`  → ${videoUrlMap.size}/${videoFiles.length} videos uploaded.`);

  console.log("\n[2/4] Uploading MP3 audio files...");
  const audioDir = path.join(__dirname, "media", "audio");
  const audioFiles = fs.readdirSync(audioDir).filter((f) => f.endsWith(".mp3"));
  const audioUrlMap = new Map<string, string>();

  for (const filename of audioFiles) {
    const filePath = path.join(audioDir, filename);
    const cdnUrl = await uploadFile(filePath, filename, "audio/mpeg");
    if (cdnUrl) audioUrlMap.set(filename, cdnUrl);
  }
  console.log(`  → ${audioUrlMap.size}/${audioFiles.length} audio files uploaded.`);

  // ─── Step 2: Patch mediaItem documents ───────────────────────────────────

  console.log("\n[3/4] Patching mediaItem documents in Sanity...");
  const mediaItems = await client.fetch<Array<{ _id: string; mediaType: string; embedUrl?: string }>>(
    '*[_type == "mediaItem"]{ _id, mediaType, embedUrl }'
  );

  let patchedCount = 0;
  let skippedCount = 0;

  for (const item of mediaItems) {
    if (!item.embedUrl || !isOldSiteUrl(item.embedUrl)) {
      skippedCount++;
      continue;
    }

    const filename = extractFilename(item.embedUrl);
    if (!filename) {
      console.warn(`  [WARN] ${item._id}: could not extract filename from ${item.embedUrl}`);
      skippedCount++;
      continue;
    }

    const urlMap = item.mediaType === "audio" ? audioUrlMap : videoUrlMap;
    const cdnUrl = urlMap.get(filename);

    if (!cdnUrl) {
      console.warn(`  [WARN] ${item._id}: no CDN URL for ${filename}`);
      skippedCount++;
      continue;
    }

    await client.patch(item._id).set({ embedUrl: cdnUrl }).commit();
    console.log(`  ✓ ${item._id}: ${filename}`);
    patchedCount++;
  }

  console.log(`  → ${patchedCount} patched, ${skippedCount} skipped.`);

  // ─── Step 3: Set heroImage in siteSettings ────────────────────────────────

  console.log("\n[4/4] Uploading hero image for siteSettings...");
  const heroImagePath = path.join(__dirname, "images", "site_header.jpg");
  const heroRef = await uploadImage(heroImagePath, "site_header.jpg");

  if (heroRef) {
    await client
      .patch("siteSettings")
      .set({
        heroImage: { _type: "image", asset: heroRef },
      })
      .commit();
    console.log("  ✓ siteSettings.heroImage updated.");
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log("\n" + "=".repeat(65));
  console.log("SUMMARY");
  console.log(`  Videos uploaded:     ${videoUrlMap.size}/${videoFiles.length}`);
  console.log(`  Audio uploaded:      ${audioUrlMap.size}/${audioFiles.length}`);
  console.log(`  MediaItems patched:  ${patchedCount}`);
  console.log(`  MediaItems skipped:  ${skippedCount}`);
  console.log(`  heroImage:           ${heroRef ? "SET" : "SKIPPED (file missing)"}`);
  console.log("=".repeat(65));
}

main().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
