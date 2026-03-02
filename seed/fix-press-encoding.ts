/**
 * fix-press-encoding.ts
 *
 * Task 1: Re-scrape press articles from the old site with correct ISO-8859-1
 *         encoding and update Sanity descriptions that contain garbled text.
 *
 * Task 2: Download PDFs from the old site, upload to Sanity CDN, and update
 *         the externalUrl to point to the Sanity CDN URL.
 *
 * Usage:
 *   cd seed && export $(cat ../.env.local | xargs) && npx tsx fix-press-encoding.ts
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
const OLD_SITE_BASE = "http://www.andreasmagdanz.de/";

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

// ---------------------------------------------------------------------------
// Mapping: Sanity document ID → old site text file name
// These are the articles that were originally scraped from .txt files on the
// old site using the URL pattern: index.php?id=6&linkurl=FILENAME.txt
// ---------------------------------------------------------------------------

const TEXT_ARTICLE_MAP: Record<string, string> = {
  "media-p03": "spon_11-2012.txt",
  "media-p04": "nzz_2-2013.txt",
  "media-p05": "artmag_11-2012.txt",
  "media-p07": "goethe_2-2013.txt",
  "media-p08": "nyt01-2004_en.txt",
  "media-p09": "ht08-2001.txt",
  "media-p10": "faz08-2001.txt",
  "media-p11": "sp07-2006.txt",
  "media-p12": "faz05-2006.txt",
  "media-p13": "wel05-2006.txt",
  "media-p15": "bz05-2006.txt",
  "media-p16": "taz_150511_gesellschaft-kultur.txt",
  "media-p17": "taz_03-2013.txt",
  "media-p18": "pn04-2004.txt",
  "media-p19": "taz03-2001.txt",
  "media-p20": "tp03-2001.txt",
};

// PDF articles to download and upload to Sanity CDN
const PDF_ARTICLE_MAP: Record<string, string> = {
  "media-p01": "http://www.andreasmagdanz.de/content/presse/txt/genanz_230201_zurueck-im-bunker.pdf",
  "media-p02": "http://www.andreasmagdanz.de/content/presse/txt/sz_181013_waldesruh.pdf",
  "media-p06": "http://www.andreasmagdanz.de/content/presse/txt/OSMOS_1-2013_Magdanz_Stammheim.pdf",
  "media-p14": "http://www.andreasmagdanz.de/content/presse/txt/wams_080810.pdf",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let keyCounter = 0;
function key(): string {
  keyCounter += 1;
  return `fix${keyCounter.toString(36).padStart(5, "0")}`;
}

/**
 * Convert plain text into Portable Text block array.
 * Splits on double newlines for paragraphs. Single newlines within a
 * paragraph are converted to spaces.
 */
function toPortableText(text: string): Array<Record<string, unknown>> {
  if (!text?.trim()) return [];
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  return paragraphs.map((p) => ({
    _type: "block",
    _key: key(),
    style: "normal",
    children: [
      {
        _type: "span",
        _key: key(),
        text: p.replace(/\n/g, " ").trim(),
        marks: [],
      },
    ],
    markDefs: [],
  }));
}

/**
 * Fetch a page from the old site as an ArrayBuffer, then decode it from
 * ISO-8859-1 to proper UTF-8 string.
 */
async function fetchWithLatin1(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const buffer = await response.arrayBuffer();
  // The old site uses charset=iso-8859-1
  return new TextDecoder("iso-8859-1").decode(buffer);
}

/**
 * Decode HTML entities commonly found in the old site's press pages.
 * Handles both named entities and numeric entities.
 */
function decodeHtmlEntities(html: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&auml;": "ä",
    "&ouml;": "ö",
    "&uuml;": "ü",
    "&Auml;": "Ä",
    "&Ouml;": "Ö",
    "&Uuml;": "Ü",
    "&szlig;": "ß",
    "&nbsp;": " ",
    "&raquo;": "\u00BB",
    "&laquo;": "\u00AB",
    "&ndash;": "\u2013",
    "&mdash;": "\u2014",
    "&hellip;": "\u2026",
    "&bull;": "\u2022",
    "&copy;": "\u00A9",
    "&reg;": "\u00AE",
    "&trade;": "\u2122",
    "&euro;": "\u20AC",
    "&pound;": "\u00A3",
    "&yen;": "\u00A5",
    "&sect;": "\u00A7",
    "&para;": "\u00B6",
    "&deg;": "\u00B0",
    "&sup2;": "\u00B2",
    "&sup3;": "\u00B3",
    "&frac12;": "\u00BD",
    "&frac14;": "\u00BC",
    "&frac34;": "\u00BE",
    "&times;": "\u00D7",
    "&divide;": "\u00F7",
    "&acute;": "\u00B4",
    "&cedil;": "\u00B8",
    "&agrave;": "à",
    "&aacute;": "á",
    "&acirc;": "â",
    "&atilde;": "ã",
    "&aring;": "å",
    "&aelig;": "æ",
    "&ccedil;": "ç",
    "&egrave;": "è",
    "&eacute;": "é",
    "&ecirc;": "ê",
    "&euml;": "ë",
    "&igrave;": "ì",
    "&iacute;": "í",
    "&icirc;": "î",
    "&iuml;": "ï",
    "&ntilde;": "ñ",
    "&ograve;": "ò",
    "&oacute;": "ó",
    "&ocirc;": "ô",
    "&otilde;": "õ",
    "&oslash;": "ø",
    "&ugrave;": "ù",
    "&uacute;": "ú",
    "&ucirc;": "û",
    "&yacute;": "ý",
    "&thorn;": "þ",
    "&Agrave;": "À",
    "&Aacute;": "Á",
    "&Acirc;": "Â",
    "&Atilde;": "Ã",
    "&Aring;": "Å",
    "&AElig;": "Æ",
    "&Ccedil;": "Ç",
    "&Egrave;": "È",
    "&Eacute;": "É",
    "&Ecirc;": "Ê",
    "&Euml;": "Ë",
    "&Igrave;": "Ì",
    "&Iacute;": "Í",
    "&Icirc;": "Î",
    "&Iuml;": "Ï",
    "&Ntilde;": "Ñ",
    "&Ograve;": "Ò",
    "&Oacute;": "Ó",
    "&Ocirc;": "Ô",
    "&Otilde;": "Õ",
    "&Oslash;": "Ø",
    "&Ugrave;": "Ù",
    "&Uacute;": "Ú",
    "&Ucirc;": "Û",
    "&Yacute;": "Ý",
    "&THORN;": "Þ",
  };

  let result = html;

  // Replace named entities
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replaceAll(entity, char);
  }

  // Replace numeric entities like &#169; or &#x00A9;
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCodePoint(parseInt(code, 10)),
  );
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCodePoint(parseInt(code, 16)),
  );

  return result;
}

/**
 * Extract article text content from the old site's press article HTML page.
 *
 * The content is inside <TD VALIGN="TOP" WIDTH="400">...</TD>
 * We strip HTML tags but preserve line structure via <br /> tags.
 */
function extractArticleText(html: string): string {
  // Find the content column: <TD VALIGN="TOP" WIDTH="400">
  const startMarker = /VALIGN="TOP"\s+WIDTH="400">/i;
  const startMatch = html.match(startMarker);
  if (!startMatch || startMatch.index === undefined) {
    throw new Error("Could not find content column in HTML");
  }

  const contentStart = startMatch.index + startMatch[0].length;

  // Find the closing </TD> for this column
  // We need to handle nested tags, but the content area has no nested TDs
  const contentArea = html.substring(contentStart);
  const endMatch = contentArea.match(/<\/TD>/i);
  if (!endMatch || endMatch.index === undefined) {
    throw new Error("Could not find end of content column");
  }

  let content = contentArea.substring(0, endMatch.index);

  // Convert <span class="titel">...</span> to just the text (it's sub-headings)
  content = content.replace(/<span[^>]*class="titel"[^>]*>(.*?)<\/span>/gi, "$1");

  // Convert <hr /> to a separator
  content = content.replace(/<hr\s*\/?>/gi, "\n\n---\n\n");

  // Convert <br /> and <br> to newlines
  content = content.replace(/<br\s*\/?>/gi, "\n");

  // Remove bold tags but keep content
  content = content.replace(/<\/?b>/gi, "");

  // Remove italic tags but keep content
  content = content.replace(/<\/?i>/gi, "");

  // Remove any remaining HTML tags
  content = content.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  content = decodeHtmlEntities(content);

  // Clean up whitespace
  content = content
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Collapse 3+ consecutive newlines into 2
  content = content.replace(/\n{3,}/g, "\n\n");

  // Trim leading/trailing whitespace
  content = content.trim();

  return content;
}

/**
 * Check if a Portable Text description contains encoding issues
 * (U+FFFD replacement characters).
 */
function hasEncodingIssues(description: any[]): boolean {
  if (!description || !Array.isArray(description)) return false;
  for (const block of description) {
    if (block.children && Array.isArray(block.children)) {
      for (const child of block.children) {
        if (typeof child.text === "string" && child.text.includes("\uFFFD")) {
          return true;
        }
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Task 1: Re-scrape press articles with correct encoding
// ---------------------------------------------------------------------------

async function fixTextArticles(): Promise<void> {
  console.log("=".repeat(70));
  console.log("TASK 1: Re-scrape press articles with correct encoding");
  console.log("=".repeat(70));
  console.log();

  // Fetch all press items with descriptions from Sanity
  const items = await client.fetch(
    '*[_type == "mediaItem" && mediaType == "press" && defined(description)]{_id, title, description}',
  );

  console.log(`Found ${items.length} press items with descriptions in Sanity.\n`);

  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    const docId = item._id;
    const txtFile = TEXT_ARTICLE_MAP[docId];

    if (!txtFile) {
      console.log(`  SKIP: ${docId} (${item.title}) — not in text article map`);
      skipped++;
      continue;
    }

    // Check if this article has encoding issues
    if (!hasEncodingIssues(item.description)) {
      console.log(`  OK: ${docId} (${item.title}) — no encoding issues detected`);
      skipped++;
      continue;
    }

    console.log(`  FIXING: ${docId} (${item.title})`);
    console.log(`    Source: ${txtFile}`);

    const url = `${OLD_SITE_BASE}index.php?id=6&linkurl=${txtFile}`;

    try {
      const html = await fetchWithLatin1(url);
      const articleText = extractArticleText(html);

      if (!articleText || articleText.length < 50) {
        console.log(`    WARNING: Extracted text is very short (${articleText.length} chars)`);
        console.log(`    Text: ${articleText.substring(0, 100)}...`);
        failed++;
        continue;
      }

      const blocks = toPortableText(articleText);
      console.log(`    Extracted ${articleText.length} chars → ${blocks.length} blocks`);

      // Preview first block
      const firstBlockText = (blocks[0]?.children as any)?.[0]?.text || "";
      console.log(`    Preview: ${firstBlockText.substring(0, 80)}...`);

      // Update Sanity
      await client.patch(docId).set({ description: blocks }).commit();
      console.log(`    UPDATED in Sanity`);
      fixed++;
    } catch (err) {
      console.error(
        `    FAILED: ${err instanceof Error ? err.message : err}`,
      );
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log();
  console.log("--- Task 1 Summary ---");
  console.log(`Fixed:   ${fixed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Total:   ${items.length}`);
  console.log();
}

// ---------------------------------------------------------------------------
// Task 2: Download PDFs and upload to Sanity CDN
// ---------------------------------------------------------------------------

async function fixPdfArticles(): Promise<void> {
  console.log("=".repeat(70));
  console.log("TASK 2: Download PDFs and upload to Sanity CDN");
  console.log("=".repeat(70));
  console.log();

  // Ensure temp directory exists for PDFs
  const tmpDir = path.join(__dirname, "media", "pdfs");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [docId, pdfUrl] of Object.entries(PDF_ARTICLE_MAP)) {
    const filename = pdfUrl.split("/").pop()!;
    console.log(`  Processing: ${docId} — ${filename}`);

    try {
      // Check current state in Sanity
      const doc = await client.fetch(
        '*[_id == $id][0]{_id, title, externalUrl}',
        { id: docId },
      );

      if (!doc) {
        console.log(`    SKIP: Document ${docId} not found in Sanity`);
        skipped++;
        continue;
      }

      // Check if already pointing to Sanity CDN
      if (doc.externalUrl?.includes("cdn.sanity.io")) {
        console.log(`    SKIP: Already on Sanity CDN`);
        skipped++;
        continue;
      }

      // Download the PDF
      console.log(`    Downloading from: ${pdfUrl}`);
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} downloading ${pdfUrl}`);
      }

      const pdfBuffer = Buffer.from(await response.arrayBuffer());
      const localPath = path.join(tmpDir, filename);
      fs.writeFileSync(localPath, pdfBuffer);
      console.log(`    Downloaded: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

      // Upload to Sanity CDN
      console.log(`    Uploading to Sanity CDN...`);
      const asset = await client.assets.upload("file", fs.createReadStream(localPath), {
        filename,
        contentType: "application/pdf",
      });

      // Build the Sanity CDN URL
      // asset._id format: "file-HASH-pdf"
      const assetIdParts = asset._id.replace("file-", "");
      const hashAndExt = assetIdParts; // e.g. "abc123def-pdf"
      const sanityFileUrl = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${hashAndExt.replace("-pdf", ".pdf")}`;

      // Update the document
      await client
        .patch(docId)
        .set({
          externalUrl: sanityFileUrl,
          file: {
            _type: "file",
            asset: {
              _type: "reference",
              _ref: asset._id,
            },
          },
        })
        .commit();

      console.log(`    UPDATED: ${doc.title}`);
      console.log(`    New URL: ${sanityFileUrl}`);
      uploaded++;

      // Clean up local file
      fs.unlinkSync(localPath);
    } catch (err) {
      console.error(
        `    FAILED: ${err instanceof Error ? err.message : err}`,
      );
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log();
  console.log("--- Task 2 Summary ---");
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);
  console.log(`Total:    ${Object.keys(PDF_ARTICLE_MAP).length}`);
  console.log();
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

async function verify(): Promise<void> {
  console.log("=".repeat(70));
  console.log("VERIFICATION: Checking all press items");
  console.log("=".repeat(70));
  console.log();

  const items = await client.fetch(
    '*[_type == "mediaItem" && mediaType == "press"]{_id, title, externalUrl, description} | order(_id asc)',
  );

  let encodingIssues = 0;
  let oldSiteUrls = 0;
  let noContent = 0;

  for (const item of items) {
    const issues: string[] = [];

    // Check for encoding issues
    if (hasEncodingIssues(item.description)) {
      issues.push("ENCODING ISSUES");
      encodingIssues++;
    }

    // Check for old site URLs
    if (item.externalUrl?.includes("andreasmagdanz.de")) {
      issues.push("OLD SITE URL");
      oldSiteUrls++;
    }

    // Check for missing content
    if (
      !item.description?.length &&
      !item.externalUrl
    ) {
      issues.push("NO CONTENT");
      noContent++;
    }

    const status = issues.length > 0 ? issues.join(", ") : "OK";

    // For items with descriptions, show a preview
    let preview = "";
    if (item.description?.length > 0) {
      const firstBlock = item.description[0];
      if (firstBlock?.children?.[0]?.text) {
        preview = firstBlock.children[0].text.substring(0, 60);
      }
    }

    const urlInfo = item.externalUrl
      ? item.externalUrl.includes("cdn.sanity.io")
        ? " [Sanity CDN]"
        : ` [${item.externalUrl.substring(0, 50)}...]`
      : "";

    console.log(
      `  ${item._id} | ${status.padEnd(20)} | ${item.title}${urlInfo}`,
    );
    if (preview) {
      console.log(`  ${"".padEnd(item._id.length)} | ${"".padEnd(20)} | "${preview}..."`);
    }
  }

  console.log();
  console.log("--- Verification Summary ---");
  console.log(`Total items:     ${items.length}`);
  console.log(`Encoding issues: ${encodingIssues}`);
  console.log(`Old site URLs:   ${oldSiteUrls}`);
  console.log(`No content:      ${noContent}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Fix Press Encoding — Andreas Magdanz Portfolio\n");

  // Task 1: Fix encoding in text articles
  await fixTextArticles();

  // Task 2: Download PDFs and upload to Sanity CDN
  await fixPdfArticles();

  // Verify everything
  await verify();

  console.log("\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
