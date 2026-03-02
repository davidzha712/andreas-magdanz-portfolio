/**
 * seed-media.ts
 *
 * Uploads downloaded audio/video files to Sanity and updates each mediaItem
 * document so its embedUrl points to the Sanity CDN file URL instead of
 * the old andreasmagdanz.de PHP script.
 *
 * Prerequisites:
 *   1. Run `bash seed/download-media.sh` first to download all media files.
 *   2. Set SANITY_API_WRITE_TOKEN in the environment.
 *
 * Usage:
 *   cd seed && npx tsx seed-media.ts
 */

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

const AUDIO_DIR = path.join(__dirname, "media", "audio");
const VIDEO_DIR = path.join(__dirname, "media", "video");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the filename from an old-site embed URL like
 *  `http://www.andreasmagdanz.de/index.php?id=6002&media=FILENAME.mp4`  */
function extractFilename(embedUrl: string): string | null {
  const match = embedUrl.match(/media=([^&]+)/);
  return match ? match[1] : null;
}

/** Determine MIME type from file extension. */
function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".mp4":
      return "video/mp4";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}

interface MediaItemDoc {
  _id: string;
  _type: string;
  title: string;
  mediaType: "audio" | "video" | "press";
  embedUrl?: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Fetch all media items that still point to the old site
  const query = `*[_type == "mediaItem" && (mediaType == "audio" || mediaType == "video") && embedUrl match "andreasmagdanz.de*"]{
    _id, _type, title, mediaType, embedUrl
  }`;
  const items: MediaItemDoc[] = await client.fetch(query);

  console.log(`Found ${items.length} media items pointing to old site.\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    if (!item.embedUrl) {
      console.log(`  SKIP (no embedUrl): ${item._id}`);
      skipped++;
      continue;
    }

    const filename = extractFilename(item.embedUrl);
    if (!filename) {
      console.log(`  SKIP (cannot parse filename): ${item._id} — ${item.embedUrl}`);
      skipped++;
      continue;
    }

    // Determine local file path
    const isAudio = item.mediaType === "audio";
    const localDir = isAudio ? AUDIO_DIR : VIDEO_DIR;
    const localPath = path.join(localDir, filename);

    if (!fs.existsSync(localPath)) {
      console.log(`  SKIP (file not found): ${filename}`);
      skipped++;
      continue;
    }

    const stat = fs.statSync(localPath);
    if (stat.size === 0) {
      console.log(`  SKIP (empty file): ${filename}`);
      skipped++;
      continue;
    }

    const contentType = contentTypeFor(filename);

    console.log(`  Uploading: ${filename} (${(stat.size / 1024 / 1024).toFixed(1)} MB) ...`);

    try {
      // Upload the file to Sanity
      const fileStream = fs.createReadStream(localPath);
      const asset = await client.assets.upload("file", fileStream, {
        filename,
        contentType,
      });

      // Build the Sanity CDN URL for the file
      // Format: https://cdn.sanity.io/files/PROJECT_ID/DATASET/ASSET_ID.EXT
      const ext = path.extname(filename);
      const sanityFileUrl = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${asset._id.replace("file-", "").replace(`-${ext.slice(1)}`, "")}.${ext.slice(1)}`;

      // Update the media item document:
      //   - Set embedUrl to the direct Sanity CDN file URL
      //   - Store the Sanity file reference for future use
      await client
        .patch(item._id)
        .set({
          embedUrl: sanityFileUrl,
          file: {
            _type: "file",
            asset: {
              _type: "reference",
              _ref: asset._id,
            },
          },
        })
        .commit();

      console.log(`  OK: ${item._id} → ${sanityFileUrl}`);
      uploaded++;
    } catch (err) {
      console.error(`  FAILED: ${filename} — ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);
  console.log(`Total:    ${items.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
