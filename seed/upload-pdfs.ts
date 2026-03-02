/**
 * upload-pdfs.ts
 *
 * Downloads PDFs from the old site, uploads to Sanity CDN,
 * and patches the `pdfFile` field on each mediaItem document.
 *
 * Usage:
 *   cd seed && npx tsx upload-pdfs.ts
 *
 * Requires SANITY_API_WRITE_TOKEN in environment or ../.env.local
 */

import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local if token not in env
if (!process.env.SANITY_API_WRITE_TOKEN) {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const client = createClient({
  projectId: "b8e16q3y",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const PDF_ARTICLES: Record<string, string> = {
  "media-p01":
    "http://www.andreasmagdanz.de/content/presse/txt/genanz_230201_zurueck-im-bunker.pdf",
  "media-p02":
    "http://www.andreasmagdanz.de/content/presse/txt/sz_181013_waldesruh.pdf",
  "media-p06":
    "http://www.andreasmagdanz.de/content/presse/txt/OSMOS_1-2013_Magdanz_Stammheim.pdf",
  "media-p14":
    "http://www.andreasmagdanz.de/content/presse/txt/wams_080810.pdf",
};

async function main() {
  console.log("Uploading PDFs to Sanity CMS...\n");

  let success = 0;
  let failed = 0;

  for (const [docId, pdfUrl] of Object.entries(PDF_ARTICLES)) {
    const filename = pdfUrl.split("/").pop()!;
    console.log(`[${docId}] Downloading ${filename}...`);

    try {
      // Check if pdfFile already exists
      const existing = await client.fetch(
        `*[_id == $id][0]{pdfFile}`,
        { id: docId }
      );
      if (existing?.pdfFile?.asset?._ref) {
        console.log(`  Already has pdfFile, skipping.\n`);
        success++;
        continue;
      }

      // Download PDF
      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      console.log(`  Downloaded ${(buffer.length / 1024).toFixed(0)} KB`);

      // Upload to Sanity
      const asset = await client.assets.upload("file", buffer, {
        filename,
        contentType: "application/pdf",
      });
      console.log(`  Uploaded → ${asset._id}`);

      // Patch document
      await client
        .patch(docId)
        .set({
          pdfFile: {
            _type: "file",
            asset: {
              _type: "reference",
              _ref: asset._id,
            },
          },
        })
        .commit();

      console.log(`  Patched pdfFile field.\n`);
      success++;
    } catch (err) {
      console.error(`  FAILED: ${err}\n`);
      failed++;
    }
  }

  console.log("─".repeat(40));
  console.log(`Done. Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
