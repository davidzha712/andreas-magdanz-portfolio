/**
 * translate-media-titles.ts
 *
 * Patches `titleEn` on all mediaItem documents.
 * Translations: merged best of Claude Opus 4.6 + Gemini 2.5 Pro
 *
 * Usage:
 *   cd seed && npx tsx translate-media-titles.ts
 */

import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

/* ── Best-of-two-AIs English titles ── */
const translations: Record<string, string> = {
  // ── Press ──
  "media-p01": "Back in the Bunker",
  "media-p02":
    "Forest Repose, ...the Killing at Hambacher Forst",
  "media-p03": "Photographic Research on Death Row",
  "media-p04": "High Security in Times of Terror",
  "media-p05": "Andreas Magdanz: Stuttgart Stammheim",
  "media-p06": "Andreas Magdanz, Stuttgart Stammheim",
  "media-p07": "Stammheim for Eternity — Andreas Magdanz",
  "media-p08": "Pictures at the Hotel Armageddon",
  "media-p09": "Cathedrals of the Cold War",
  "media-p10": "Cathedral of the Cold War",
  "media-p11": "The Bavarian Civil Servant Bond",
  "media-p12": "A Blend of the Extreme and the Banal",
  "media-p13": "Not a Soul in Pullach",
  "media-p14": "Secret Places of the Republic",
  "media-p15": "Individual Security Access System",
  "media-p16":
    "Patient Forest Near Death — Forensic Photographs Against the Destruction of the Hambacher Forst",
  "media-p17": "Washable Architectural Modernism",
  "media-p18": "Auschwitz-Birkenau",
  "media-p19": "Andreas Magdanz — Dienststelle Marienthal",
  "media-p20": "The Madness of Nuclear War Games",

  // ── Video ──
  "media-v01": "Farewell to Stammheim",
  "media-v02": "The Government Bunker — In the Depths of History",
  "media-v03":
    "Into the Hambacher Forst with Photographer Andreas Magdanz",
  "media-v04": "Vernissage at KUK, StädteRegion Aachen",
  "media-v05": "Überfahrt Machine Lab, Making-of",
  "media-v06":
    "RWTH Aachen, EMU, Überfahrt Machine Lab with Interview",
  "media-v07": "Hambacher Forst — A Student Assessment",
  "media-v08": "Studio Guest Andreas Magdanz",
  "media-v09": "Hambacher Forst, a Forest Exposure",
  "media-v10": "Magdanz, Stammheim",
  "media-v11": "The Myth of Stammheim",
  "media-v12": "Brussels III — Visit of King Albert II",
  "media-v13": "Vogelsang",
  "media-v14": "Camp Vogelsang: Photographs by Andreas Magdanz",
  "media-v15": "Photographer Working on Vogelsang Photo Book",
  "media-v16": "Interview",
  "media-v17": "Interview",
  "media-v18": "Interview",
  "media-v19": "Interview",
  "media-v20": "Bunker Museum, Interview",

  // ── Audio ──
  "media-a01": "Photographer Andreas Magdanz Explores RWTH Aachen",
  "media-a02":
    "Economy Meets Art — A Project by Photographer Andreas Magdanz",
  "media-a03": "A Memorial Against the Destruction of a Forest",
  "media-a04":
    "On the Road in the Hambacher Forst with Photographer Andreas Magdanz",
  "media-a05": "Stammheim in Pictures",
  "media-a06": "Stammheim Prison",
  "media-a07": "Vogelsang, Interview",
  "media-a08":
    "Nazi Fortress Through the Eyes of an Artist: Andreas Magdanz Photographs Vogelsang",
  "media-a09": "Fortress in Transition",
  "media-a10": "Nazi Past in the National Park",
  "media-a11": "Top Secret! Interview",
  "media-a12": "Interview",
  "media-a13": "Interview",
};

async function main() {
  console.log("Patching English titles (best-of-two-AIs merge)...\n");

  let success = 0;
  let failed = 0;

  for (const [docId, titleEn] of Object.entries(translations)) {
    try {
      await client.patch(docId).set({ titleEn }).commit();
      console.log(`  ✓ ${docId}: ${titleEn}`);
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${docId}: ${msg}`);
      failed++;
    }
  }

  console.log("\n" + "─".repeat(40));
  console.log(`Done. Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
