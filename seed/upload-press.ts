/**
 * upload-press.ts
 *
 * Downloads press PDFs and text articles from the old site and uploads them
 * to Sanity. For PDFs, sets pdfUrl on mediaItem (enables flip viewer).
 * For text articles, converts them to Portable Text and sets description.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=<token> npx tsx upload-press.ts
 */

import { createClient } from "@sanity/client";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SANITY_PROJECT_ID = "b8e16q3y";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "2024-01-01";
const OLD_SITE = "http://www.andreasmagdanz.de";

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

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    proto.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadBuffer(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (!res.statusCode || res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (d: Buffer) => chunks.push(d));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject).on("timeout", () => reject(new Error("Timeout")));
  });
}

// ─── Text parsing ─────────────────────────────────────────────────────────────

let keyCounter = 0;
function key(): string {
  keyCounter++;
  return `k${keyCounter.toString(36).padStart(6, "0")}`;
}

function textToPortableText(raw: string): Array<Record<string, unknown>> {
  // Decode ISO-8859-1 chars (already decoded via latin1 buffer toString)
  // Remove title tag (we already have title in Sanity)
  let text = raw
    .replace(/<titel>.*?<titelende>/gsi, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  const blocks: Array<Record<string, unknown>> = [];

  for (const p of paragraphs) {
    // Skip first 1-2 lines that are just "Source\nDate" (already in Sanity)
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(p) || /^Von /.test(p)) continue;
    // Skip source name line (first paragraph with no spaces, max 50 chars)
    if (p.length < 50 && !p.includes(" ") && blocks.length === 0) continue;

    // Detect bold paragraphs
    const isBold = p.startsWith("<b>") || p.includes("<b>");
    const cleaned = p
      .replace(/<b>/gi, "")
      .replace(/<\/b>/gi, "")
      .replace(/<[^>]+>/g, "") // strip remaining HTML tags
      .replace(/\n/g, " ")
      .trim();

    if (!cleaned) continue;

    blocks.push({
      _type: "block",
      _key: key(),
      style: isBold ? "blockquote" : "normal",
      children: [
        {
          _type: "span",
          _key: key(),
          text: cleaned,
          marks: [],
        },
      ],
      markDefs: [],
    });
  }

  return blocks;
}

// ─── Press item data ──────────────────────────────────────────────────────────

const PRESS_ITEMS = [
  // PDF items — upload to Sanity, set as pdfUrl
  {
    id: "media-p01",
    pdfUrl: `${OLD_SITE}/content/presse/txt/genanz_230201_zurueck-im-bunker.pdf`,
    filename: "genanz_230201_zurueck-im-bunker.pdf",
  },
  {
    id: "media-p02",
    pdfUrl: `${OLD_SITE}/content/presse/txt/sz_181013_waldesruh.pdf`,
    filename: "sz_181013_waldesruh.pdf",
  },
  {
    id: "media-p06",
    pdfUrl: `${OLD_SITE}/content/presse/txt/OSMOS_1-2013_Magdanz_Stammheim.pdf`,
    filename: "OSMOS_1-2013_Magdanz_Stammheim.pdf",
  },
  {
    id: "media-p14",
    pdfUrl: `${OLD_SITE}/content/presse/txt/wams_080810.pdf`,
    filename: "wams_080810.pdf",
  },

  // Text articles — download .txt, convert to Portable Text, set as description
  { id: "media-p03", txtFile: "spon_11-2012.txt" },
  { id: "media-p04", txtFile: "nzz_2-2013.txt" },
  { id: "media-p05", txtFile: "artmag_11-2012.txt" },
  { id: "media-p07", txtFile: "goethe_2-2013.txt" },
  { id: "media-p08", txtFile: "nyt01-2004_en.txt" },
  { id: "media-p09", txtFile: "ht08-2001.txt" },
  { id: "media-p10", txtFile: "faz08-2001.txt" },
  { id: "media-p11", txtFile: "sp07-2006.txt" },
  { id: "media-p12", txtFile: "faz05-2006.txt" },
  { id: "media-p13", txtFile: "wel05-2006.txt" },
  { id: "media-p15", txtFile: "bz05-2006.txt" },
  { id: "media-p16", txtFile: "taz_150511_gesellschaft-kultur.txt" },
  { id: "media-p17", txtFile: "taz_03-2013.txt" },
  { id: "media-p18", txtFile: "pn04-2004.txt" },
  { id: "media-p19", txtFile: "taz03-2001.txt" },
  { id: "media-p20", txtFile: "tp03-2001.txt" },
];

async function main() {
  console.log("=".repeat(65));
  console.log("Press Content Upload — Andreas Magdanz Portfolio");
  console.log(`Project: ${SANITY_PROJECT_ID} | Dataset: ${SANITY_DATASET}`);
  console.log("=".repeat(65));

  const pdfItems = PRESS_ITEMS.filter((i) => "pdfUrl" in i) as Array<{
    id: string;
    pdfUrl: string;
    filename: string;
  }>;
  const txtItems = PRESS_ITEMS.filter((i) => "txtFile" in i) as Array<{
    id: string;
    txtFile: string;
  }>;

  // ─── Upload PDFs ────────────────────────────────────────────────────────────

  console.log(`\n[1/2] Uploading ${pdfItems.length} press PDFs...`);
  let pdfOk = 0;
  const tempDir = path.join(__dirname, "_tmp_press");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  for (const item of pdfItems) {
    const localPath = path.join(tempDir, item.filename);
    try {
      // Download
      console.log(`  Downloading ${item.filename}...`);
      const buf = await downloadBuffer(item.pdfUrl);
      fs.writeFileSync(localPath, buf);
      console.log(`  Downloaded (${(buf.length / 1024).toFixed(0)} KB)`);

      // Upload to Sanity
      const asset = await client.assets.upload(
        "file",
        fs.createReadStream(localPath),
        { filename: item.filename, contentType: "application/pdf" }
      );

      // Store as proper file reference — schema field is pdfFile
      // GROQ query reads: "pdfUrl": pdfFile.asset->url
      const pdfFile = {
        _type: "file",
        asset: { _type: "reference", _ref: asset._id },
      };
      await client.patch(item.id).set({ pdfFile }).commit();
      console.log(`  ✓ ${item.id}: pdfFile → ${asset._id}`);
      pdfOk++;
    } catch (err) {
      console.error(`  ✗ ${item.id}: ${(err as Error).message}`);
    }
  }

  // ─── Download & parse text articles ─────────────────────────────────────────

  console.log(`\n[2/2] Downloading & parsing ${txtItems.length} press articles...`);
  let txtOk = 0;

  for (const item of txtItems) {
    const url = `${OLD_SITE}/content/presse/txt/${item.txtFile}`;
    try {
      const buf = await downloadBuffer(url);
      // The files are ISO-8859-1 encoded
      const raw = buf.toString("latin1");
      const blocks = textToPortableText(raw);

      if (blocks.length === 0) {
        console.warn(`  [WARN] ${item.id}: no blocks parsed from ${item.txtFile}`);
        continue;
      }

      await client.patch(item.id).set({ description: blocks }).commit();
      console.log(`  ✓ ${item.id} (${item.txtFile}): ${blocks.length} blocks`);
      txtOk++;
    } catch (err) {
      console.error(`  ✗ ${item.id} (${item.txtFile}): ${(err as Error).message}`);
    }
  }

  // Cleanup temp files
  try {
    fs.rmSync(tempDir, { recursive: true });
  } catch {}

  // ─── Summary ────────────────────────────────────────────────────────────────

  console.log("\n" + "=".repeat(65));
  console.log("SUMMARY");
  console.log(`  PDFs uploaded & linked:  ${pdfOk}/${pdfItems.length}`);
  console.log(`  Articles imported:       ${txtOk}/${txtItems.length}`);
  console.log("=".repeat(65));
}

main().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
