/**
 * Fetches all German content from Sanity that needs English translation.
 * Outputs to /tmp/sanity-content-dump.json
 *
 * Usage: cd seed && npx tsx fetch-content.ts
 */
import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
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

const client = createClient({
  projectId: "b8e16q3y",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});

function extractText(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return "";
  return blocks
    .filter((b) => b._type === "block" && b.children)
    .map((b) => b.children.map((c: any) => c.text).join(""))
    .join("\n\n");
}

async function main() {
  const settings = await client.fetch(`*[_type == "siteSettings"][0]{
    _id, siteDescription, siteDescriptionEn,
    artistBio, artistBioEn,
    teachingHistory, teachingHistoryEn,
    universityInfo, universityInfoEn
  }`);

  const projects = await client.fetch(`*[_type == "project"]{
    _id, title, artistStatement, artistStatementEn, description, descriptionEn
  }`);

  const cvEntries = await client.fetch(`*[_type == "cvEntry"]{
    _id, title, titleEn, description, descriptionEn, category
  }`);

  const exhibitions = await client.fetch(`*[_type == "exhibition"]{
    _id, title, country, countryEn, description, descriptionEn
  }`);

  const publications = await client.fetch(`*[_type == "publication"]{
    _id, title, description, descriptionEn
  }`);

  const mediaItems = await client.fetch(`*[_type == "mediaItem" && defined(description)]{
    _id, title, description, descriptionEn
  }`);

  // Save full dump
  fs.writeFileSync(
    "/tmp/sanity-content-dump.json",
    JSON.stringify({ settings, projects, cvEntries, exhibitions, publications, mediaItems }, null, 2)
  );

  console.log("=== SITE SETTINGS ===");
  console.log("siteDescription:", settings?.siteDescription || "EMPTY");
  console.log("siteDescriptionEn:", settings?.siteDescriptionEn || "NEEDS TRANSLATION");
  console.log("universityInfo:", settings?.universityInfo || "EMPTY");
  console.log("universityInfoEn:", settings?.universityInfoEn || "NEEDS TRANSLATION");
  console.log("artistBio text:", extractText(settings?.artistBio).substring(0, 300) || "EMPTY");
  console.log("artistBioEn:", settings?.artistBioEn?.length > 0 ? "EXISTS" : "NEEDS TRANSLATION");
  console.log("teachingHistory text:", extractText(settings?.teachingHistory).substring(0, 300) || "EMPTY");
  console.log("teachingHistoryEn:", settings?.teachingHistoryEn?.length > 0 ? "EXISTS" : "NEEDS TRANSLATION");

  console.log("\n=== PROJECTS ===");
  for (const p of projects) {
    const asText = extractText(p.artistStatement);
    const descText = extractText(p.description);
    if (asText || descText) {
      console.log(`${p._id} | ${p.title}`);
      if (asText) console.log("  artistStatement:", asText.substring(0, 150));
      if (descText) console.log("  description:", descText.substring(0, 150));
      console.log("  needsASEn:", !(p.artistStatementEn?.length > 0));
      console.log("  needsDescEn:", !(p.descriptionEn?.length > 0));
    }
  }

  console.log("\n=== CV ENTRIES (need titleEn) ===");
  const needTitle = cvEntries.filter((e: any) => e.title && !e.titleEn);
  for (const e of needTitle) {
    console.log(`${e._id} | ${e.category} | ${e.title}${e.description ? " | desc: " + e.description.substring(0, 60) : ""}`);
  }
  console.log(`Total needing titleEn: ${needTitle.length} / ${cvEntries.length}`);

  console.log("\n=== EXHIBITIONS (need countryEn) ===");
  const needCountry = exhibitions.filter((e: any) => e.country && !e.countryEn);
  const uniqueCountries = [...new Set(needCountry.map((e: any) => e.country))];
  console.log("Unique countries needing EN:", uniqueCountries.join(", "));
  console.log(`Total: ${needCountry.length} / ${exhibitions.length}`);

  console.log("\n=== PUBLICATIONS (need descriptionEn) ===");
  const needPubDesc = publications.filter((p: any) => p.description?.length > 0 && !(p.descriptionEn?.length > 0));
  for (const p of needPubDesc) {
    console.log(`${p._id} | ${p.title} | desc: ${extractText(p.description).substring(0, 100)}`);
  }

  console.log("\n=== MEDIA ITEMS (need descriptionEn) ===");
  const needMediaDesc = mediaItems.filter((m: any) => m.description?.length > 0 && !(m.descriptionEn?.length > 0));
  for (const m of needMediaDesc) {
    console.log(`${m._id} | ${m.title} | desc: ${extractText(m.description).substring(0, 100)}`);
  }

  console.log("\nDump saved to /tmp/sanity-content-dump.json");
}

main().catch(console.error);
