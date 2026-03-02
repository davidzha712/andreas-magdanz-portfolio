/**
 * translate-content.ts
 *
 * Translates all German CMS content to English using Gemini AI.
 * Patches *En fields on Sanity documents.
 *
 * Requires:
 *   SANITY_API_WRITE_TOKEN — Sanity token with write access
 *   GEMINI_API_KEY — Google Gemini API key
 *
 * Usage:
 *   cd seed && npx tsx translate-content.ts
 *
 * Options:
 *   --dry-run     Preview translations without writing to Sanity
 *   --only=TYPE   Only translate a specific type: siteSettings, project, cvEntry, exhibition
 */

import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load env ──
if (!process.env.SANITY_API_WRITE_TOKEN || !process.env.GEMINI_API_KEY) {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        if (!process.env[key]) process.env[key] = match[2].trim();
      }
    }
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SANITY_TOKEN = process.env.SANITY_API_WRITE_TOKEN;

if (!SANITY_TOKEN) {
  console.error("Missing SANITY_API_WRITE_TOKEN");
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

const sanity = createClient({
  projectId: "b8e16q3y",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_TOKEN,
  useCdn: false,
});

// ── Country mapping (deterministic, no AI needed) ──
const COUNTRY_MAP: Record<string, string> = {
  Deutschland: "Germany",
  Frankreich: "France",
  Belgien: "Belgium",
  Niederlande: "Netherlands",
  Österreich: "Austria",
  Schweiz: "Switzerland",
  Italien: "Italy",
  Spanien: "Spain",
  Portugal: "Portugal",
  Großbritannien: "United Kingdom",
  Vereinigtes: "United Kingdom",
  Irland: "Ireland",
  Dänemark: "Denmark",
  Schweden: "Sweden",
  Norwegen: "Norway",
  Finnland: "Finland",
  Polen: "Poland",
  Tschechien: "Czech Republic",
  Ungarn: "Hungary",
  Griechenland: "Greece",
  Türkei: "Turkey",
  Russland: "Russia",
  Japan: "Japan",
  China: "China",
  Indien: "India",
  Australien: "Australia",
  Kanada: "Canada",
  Mexiko: "Mexico",
  Brasilien: "Brazil",
  Argentinien: "Argentina",
  Südafrika: "South Africa",
  Vereinigte: "United States",
  USA: "USA",
  Luxemburg: "Luxembourg",
  Rumänien: "Romania",
  Kroatien: "Croatia",
  Slowenien: "Slovenia",
  Litauen: "Lithuania",
  Lettland: "Latvia",
  Estland: "Estonia",
  Island: "Iceland",
};

// ── Gemini translation helper ──
async function translateWithGemini(text: string, context: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Translate the following German text to English. This is for the website of photographer Andreas Magdanz. Context: ${context}. Keep proper nouns, place names, institution names, and artwork titles unchanged. Return ONLY the translation, no explanations.\n\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

// ── Portable Text helpers ──
interface PTBlock {
  _key: string;
  _type: string;
  style?: string;
  children?: { _key: string; _type: string; text: string; marks?: string[] }[];
  markDefs?: unknown[];
  listItem?: string;
  level?: number;
}

function extractTextFromBlocks(blocks: PTBlock[]): string {
  return blocks
    .filter((b) => b._type === "block" && b.children)
    .map((b) =>
      b.children!.map((c) => c.text).join("")
    )
    .join("\n\n");
}

function applyTranslationToBlocks(blocks: PTBlock[], translatedText: string): PTBlock[] {
  const paragraphs = translatedText.split(/\n\n+/).filter(Boolean);
  const textBlocks = blocks.filter((b) => b._type === "block" && b.children);
  const result: PTBlock[] = JSON.parse(JSON.stringify(blocks));

  let pIdx = 0;
  for (const block of result) {
    if (block._type !== "block" || !block.children) continue;
    if (pIdx < paragraphs.length) {
      // If block has single child, replace directly
      if (block.children.length === 1) {
        block.children[0].text = paragraphs[pIdx];
      } else {
        // Distribute text proportionally across children
        const original = block.children.map((c) => c.text).join("");
        const translated = paragraphs[pIdx];
        if (original.length === 0) {
          block.children[0].text = translated;
        } else {
          let offset = 0;
          for (let i = 0; i < block.children.length; i++) {
            const ratio = block.children[i].text.length / original.length;
            const len = i === block.children.length - 1
              ? translated.length - offset
              : Math.round(ratio * translated.length);
            block.children[i].text = translated.substring(offset, offset + len);
            offset += len;
          }
        }
      }
      pIdx++;
    }
  }

  return result;
}

async function translatePortableText(
  blocks: PTBlock[],
  context: string
): Promise<PTBlock[]> {
  const text = extractTextFromBlocks(blocks);
  if (!text.trim()) return blocks;

  const translated = await translateWithGemini(text, context);
  return applyTranslationToBlocks(blocks, translated);
}

// ── Stats ──
let success = 0;
let skipped = 0;
let failed = 0;

async function patch(docId: string, fields: Record<string, unknown>, label: string) {
  if (DRY_RUN) {
    console.log(`  [DRY] ${label}`);
    success++;
    return;
  }
  try {
    await sanity.patch(docId).set(fields).commit();
    console.log(`  ✓ ${label}`);
    success++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${label}: ${msg}`);
    failed++;
  }
}

// ── Rate limiter (avoid 429) ──
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main translators ──

async function translateSiteSettings() {
  console.log("\n── Site Settings ──");
  const doc = await sanity.fetch(`*[_type == "siteSettings"][0]`);
  if (!doc) {
    console.log("  No siteSettings found");
    return;
  }

  const fields: Record<string, unknown> = {};

  // siteDescription
  if (doc.siteDescription && !doc.siteDescriptionEn) {
    const translated = await translateWithGemini(doc.siteDescription, "website meta description");
    fields.siteDescriptionEn = translated;
    console.log(`  siteDescription → ${translated.substring(0, 60)}...`);
    await delay(500);
  }

  // artistBio (Portable Text)
  if (doc.artistBio?.length > 0 && (!doc.artistBioEn || doc.artistBioEn.length === 0)) {
    fields.artistBioEn = await translatePortableText(doc.artistBio, "artist biography");
    console.log(`  artistBio → ${extractTextFromBlocks(fields.artistBioEn as PTBlock[]).substring(0, 60)}...`);
    await delay(500);
  }

  // teachingHistory (Portable Text)
  if (doc.teachingHistory?.length > 0 && (!doc.teachingHistoryEn || doc.teachingHistoryEn.length === 0)) {
    fields.teachingHistoryEn = await translatePortableText(doc.teachingHistory, "teaching history / academic positions");
    console.log(`  teachingHistory → translated`);
    await delay(500);
  }

  // universityInfo
  if (doc.universityInfo && !doc.universityInfoEn) {
    const translated = await translateWithGemini(doc.universityInfo, "university affiliation");
    fields.universityInfoEn = translated;
    console.log(`  universityInfo → ${translated}`);
    await delay(500);
  }

  if (Object.keys(fields).length > 0) {
    await patch(doc._id, fields, `siteSettings (${Object.keys(fields).length} fields)`);
  } else {
    console.log("  All fields already translated");
    skipped++;
  }
}

async function translateProjects() {
  console.log("\n── Projects ──");
  const projects = await sanity.fetch(
    `*[_type == "project"]{_id, title, artistStatement, artistStatementEn, description, descriptionEn}`
  );

  for (const proj of projects) {
    const fields: Record<string, unknown> = {};

    if (proj.artistStatement?.length > 0 && (!proj.artistStatementEn || proj.artistStatementEn.length === 0)) {
      fields.artistStatementEn = await translatePortableText(
        proj.artistStatement,
        `artist statement for project "${proj.title}"`
      );
      await delay(500);
    }

    if (proj.description?.length > 0 && (!proj.descriptionEn || proj.descriptionEn.length === 0)) {
      fields.descriptionEn = await translatePortableText(
        proj.description,
        `description of photography project "${proj.title}"`
      );
      await delay(500);
    }

    if (Object.keys(fields).length > 0) {
      await patch(proj._id, fields, `project: ${proj.title}`);
    } else {
      skipped++;
    }
  }
}

async function translateCVEntries() {
  console.log("\n── CV Entries ──");
  const entries = await sanity.fetch(
    `*[_type == "cvEntry"]{_id, title, titleEn, description, descriptionEn, category}`
  );

  for (const entry of entries) {
    const fields: Record<string, unknown> = {};

    if (entry.title && !entry.titleEn) {
      const translated = await translateWithGemini(
        entry.title,
        `CV entry title (category: ${entry.category})`
      );
      fields.titleEn = translated;
      await delay(300);
    }

    if (entry.description && !entry.descriptionEn) {
      const translated = await translateWithGemini(
        entry.description,
        `CV entry description (category: ${entry.category})`
      );
      fields.descriptionEn = translated;
      await delay(300);
    }

    if (Object.keys(fields).length > 0) {
      await patch(entry._id, fields, `cvEntry: ${entry.title} → ${fields.titleEn ?? "(desc only)"}`);
    } else {
      skipped++;
    }
  }
}

async function translateExhibitions() {
  console.log("\n── Exhibitions ──");
  const exhibitions = await sanity.fetch(
    `*[_type == "exhibition"]{_id, title, country, countryEn, description, descriptionEn}`
  );

  for (const ex of exhibitions) {
    const fields: Record<string, unknown> = {};

    // Country: deterministic mapping first, AI fallback
    if (ex.country && !ex.countryEn) {
      const mapped = COUNTRY_MAP[ex.country];
      if (mapped) {
        fields.countryEn = mapped;
      } else {
        // Check if it's already in English (e.g. "USA")
        const isEnglish = /^[A-Z][a-z]+$/.test(ex.country) && !Object.keys(COUNTRY_MAP).includes(ex.country);
        if (!isEnglish) {
          const translated = await translateWithGemini(ex.country, "country name");
          fields.countryEn = translated;
          await delay(300);
        }
      }
    }

    // Description (Portable Text)
    if (ex.description?.length > 0 && (!ex.descriptionEn || ex.descriptionEn.length === 0)) {
      fields.descriptionEn = await translatePortableText(
        ex.description,
        `exhibition description for "${ex.title}"`
      );
      await delay(500);
    }

    if (Object.keys(fields).length > 0) {
      await patch(ex._id, fields, `exhibition: ${ex.title} (${ex.country} → ${fields.countryEn ?? "—"})`);
    } else {
      skipped++;
    }
  }
}

async function translatePublications() {
  console.log("\n── Publications ──");
  const pubs = await sanity.fetch(
    `*[_type == "publication"]{_id, title, description, descriptionEn}`
  );

  for (const pub of pubs) {
    if (pub.description?.length > 0 && (!pub.descriptionEn || pub.descriptionEn.length === 0)) {
      const translated = await translatePortableText(
        pub.description,
        `publication description for "${pub.title}"`
      );
      await patch(pub._id, { descriptionEn: translated }, `publication: ${pub.title}`);
      await delay(500);
    } else {
      skipped++;
    }
  }
}

async function translateMediaDescriptions() {
  console.log("\n── Media Item Descriptions ──");
  const items = await sanity.fetch(
    `*[_type == "mediaItem" && defined(description)]{_id, title, description, descriptionEn}`
  );

  for (const item of items) {
    if (item.description?.length > 0 && (!item.descriptionEn || item.descriptionEn.length === 0)) {
      const translated = await translatePortableText(
        item.description,
        `media item description for "${item.title}"`
      );
      await patch(item._id, { descriptionEn: translated }, `mediaItem: ${item.title}`);
      await delay(500);
    } else {
      skipped++;
    }
  }
}

// ── Main ──
async function main() {
  console.log(`\n🌐 CMS Content Translation (DE → EN)`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  if (ONLY) console.log(`   Filter: ${ONLY}`);
  console.log("");

  const runners: Record<string, () => Promise<void>> = {
    siteSettings: translateSiteSettings,
    project: translateProjects,
    cvEntry: translateCVEntries,
    exhibition: translateExhibitions,
    publication: translatePublications,
    mediaItem: translateMediaDescriptions,
  };

  if (ONLY) {
    const runner = runners[ONLY];
    if (!runner) {
      console.error(`Unknown type: ${ONLY}. Options: ${Object.keys(runners).join(", ")}`);
      process.exit(1);
    }
    await runner();
  } else {
    for (const runner of Object.values(runners)) {
      await runner();
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log(`Done. Success: ${success}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
