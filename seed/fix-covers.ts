/**
 * fix-covers.ts
 *
 * Uploads real cover images for each project and patches coverImage in Sanity.
 * Also adds English translations for project descriptions scraped from old site.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=<token> npx tsx fix-covers.ts
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

let keyCounter = 0;
function key(): string {
  keyCounter++;
  return `k${keyCounter.toString(36).padStart(6, "0")}`;
}

async function uploadImage(
  filename: string,
): Promise<{ _type: "reference"; _ref: string } | null> {
  const imagePath = path.join(__dirname, "images", filename);
  if (!fs.existsSync(imagePath)) {
    console.warn(`  [SKIP] Not found: ${imagePath}`);
    return null;
  }
  const stat = fs.statSync(imagePath);
  console.log(`  Uploading ${filename} (${(stat.size / 1024).toFixed(1)} KB)...`);
  try {
    const asset = await client.assets.upload(
      "image",
      fs.createReadStream(imagePath),
      { filename },
    );
    console.log(`  ✓ → ${asset._id}`);
    return { _type: "reference", _ref: asset._id };
  } catch (err) {
    console.error(`  ✗ Failed: ${(err as Error).message}`);
    return null;
  }
}

function toPortableText(text: string): Array<Record<string, unknown>> {
  if (!text?.trim()) return [];
  return text.split(/\n\n+/).filter((p) => p.trim()).map((p) => ({
    _type: "block",
    _key: key(),
    style: "normal",
    children: [{ _type: "span", _key: key(), text: p.replace(/\n/g, " ").trim(), marks: [] }],
    markDefs: [],
  }));
}

// ─── Project → cover image mapping ────────────────────────────────────────
// Each project gets its real header image from the old site (750px wide)
const PROJECT_COVERS: Array<{
  id: string;
  title: string;
  coverImageFile: string;
  artistStatementEn?: string;
  descriptionEn?: string;
}> = [
  {
    id: "project-vogelsang",
    title: "Vogelsang",
    coverImageFile: "vogelsang_header.jpg",
    artistStatementEn:
      "The goal of the VOGELSANG project is a comprehensive photographic documentation of Camp Vogelsang using large-format photography. The structure of the VOGELSANG work follows a tripartite division that captures the substantial parameters of the military training area: NATURE, ARCHITECTURE, MILITARY. Beyond the individual analysis of the three subject areas, the overall project pursues the objective of revealing the natural, architectural and military elements of the terrain in their complex mutual entanglements and references.",
    descriptionEn:
      "At the latest with the opening of the Eifel National Park on 1 January 2004, the military area of Vogelsang came into the nationwide public spotlight. In the controversial debate about the future civilian use of the former Nazi Order Castle — which is quite paradigmatic in its handling of the National Socialist legacy — one central aspect has so far received only marginal attention. This is the fact that with the withdrawal of Belgian armed forces on 1 January 2006, a significant chapter of post-war German occupation history will come to an irrevocable end.\n\nThe starting point of the artistic project VOGELSANG is the guiding thought that the historical essence of Vogelsang lies precisely in the military use of the former ideologically-run training facility by the Belgian forces.\n\nOver a period of 54 years, the approximately 4,200 hectare site has been fundamentally adapted to the concrete requirements of the democratic victorious power of the neighbouring state. The takeover took place in several stages and affects, in its very different impacts, all aspects of the complex in concrete functional as well as ideological terms.",
  },
  {
    id: "project-bnd-pullach",
    title: "BND - Standort Pullach",
    coverImageFile: "bnd_header.jpg",
    artistStatementEn:
      "The aim of the artistic project »BND - STANDORT PULLACH« by Andreas Magdanz is a comprehensive photographic documentation of the 68-hectare BND headquarters in Pullach. At the centre of the project is the production of a high-quality photo book, which appeared in April 2006 at the renowned Cologne publishing house DuMont. In analogy to the project »DIENSTSTELLE MARIENTHAL«, the BND documentation follows cartographic principles to enable the viewer to orientate themselves visually within the hermetically sealed complex.\n\nLike no other medium, large-format photography is suited to condense the historically charged subject matter on a visual level, both in terms of content and medium. The key question is: What is not visible?",
    descriptionEn:
      "Even before commencing operations on 1 April 1956, the Federal Intelligence Service (BND) was inextricably linked with the Pullach site near Munich. The Bavarian town has for decades been synonymous with a significant and controversial chapter of German post-war history. The decision taken on 10 April 2003 under Chancellor Gerhard Schröder's leadership to relocate the intelligence agency's headquarters to Berlin represents a profound caesura in the agency's self-understanding.\n\nIn the course of the relocation, Andreas Magdanz was presented with the historic opportunity to document the historically significant site in Pullach — which is expected to be largely vacated by 2011 as a result of the change of location — within the framework of an artistic photography project, without access restrictions.",
  },
  {
    id: "project-auschwitz-birkenau",
    title: "Auschwitz-Birkenau",
    coverImageFile: "auschwitz_header.jpg",
    artistStatementEn:
      "A homage to Marceline Loridan-Ivens. It was time for me to break with tradition using colour and to present the place as it appears today in June — a blooming vegetation, a nature that seems conciliatory, which given the site is peculiar, at times unbearably unsettling.\n\nThe selection of images follows the route that Marceline walked with us — from the place of her arrival clockwise through the camp to the main gate. I have taken up the staccato of chimneys, fence posts, birch trees and other landscape markers in relation to each other.\n\nAbove all, this small book is a homage to Marceline Loridan-Ivens.",
    descriptionEn:
      "The French director Jerome Missolz asked me in April 2002 whether I could imagine, in connection with a film production, engaging photographically with the concentration camp Auschwitz-Birkenau. Specifically, it was about a contribution to Marceline Loridan-Ivens's autobiographical feature film »Birkenau and Rosenfeld«, in which she, as a survivor of the concentration camp, addresses the reasons for her return to this place after fifty years.\n\nThe climate of numbing terror and inconceivable horror that once prevailed in Auschwitz can no longer be reproduced by anyone today. It was therefore time for me to break with tradition using colour and to present the place as it appears today in June — a blooming vegetation, a conciliatory-seeming nature, which given the site is peculiar, at times unbearably unsettling.\n\nIn the end it is, however, no more than an irritation I am capable of producing — about, as Jan Philip Reemtsma once put it, »something that is in the world and must not be of this world«.",
  },
  {
    id: "project-dienststelle-marienthal",
    title: "Dienststelle Marienthal",
    coverImageFile: "marienthal_header.jpg",
    artistStatementEn:
      "A building monograph. The name »Dienststelle Marienthal« was used to designate the bunker kept secret by the Federal Government in the Ahr valley near Bonn.\n\nThe artistic project pursues the approach of a comprehensive photographic documentation of the underground atomic bunker complex using large-format photography. As an analogue work to the publication, the website www.DienststelleMarienthal.de was created.",
    descriptionEn:
      "A building monograph. The name »Dienststelle Marienthal« was used to designate the bunker kept secret by the Federal Government in the Ahr valley near Bonn. The enormous underground complex was designed as the alternative seat of the Federal Government in the event of a nuclear attack.\n\nAndreas Magdanz documented this hermetically sealed world photographically for the first time, creating a unique visual testimony to the Cold War. Accompanying the book, the website www.DienststelleMarienthal.de was created.",
  },
  {
    id: "project-hambach-tagebau",
    title: "Hambach / Tagebau",
    coverImageFile: "garzweiler_header.jpg",
    artistStatementEn:
      "Working title: »Photography as a transmission line between a tangible, visually experienceable world and a spiritual reality«.\n\nThe work about the former village of Garzweiler and the associated open-cast mining was created in 1995–96, funded by the Ministry for Science and Research, Düsseldorf, as part of the Benningsen Foerder Prize. The result is a newspaper that shows photographs of landscape, people and animals across more than 50 pages.\n\nThe subject of the Rhenish brown coal open-cast mining and the threatened Hambach Forest has accompanied my work for decades. In 2015 I conducted a forensic survey of Hambach Forest with 100 students from two universities — 10,000 photographs document the 700-year-old primary forest threatened by open-cast mining.",
    descriptionEn:
      "Long-term documentation of the Rhenish brown coal open-cast mining and Hambach Forest. The work about the former village of Garzweiler and the associated open-cast mining was created in 1995–96, funded by the Ministry for Science and Research, Düsseldorf, as part of the Benningsen Foerder Prize.\n\nThe result is a newspaper that shows photographs of landscape, people and animals across more than 50 pages — with an introductory text by Prof. Dr. Walter Grasskamp translated into 6 languages. The work was also accompanied by students of the FH Aachen, FB4, Photography, over 3 semesters.\n\nIn 2015, 100 students of the HAWK and RWTH conducted a forensic survey of the Hambach Forest threatened by open-cast mining. In 2018, the topic was taken up again following the temporary stop on clearing.",
  },
  {
    id: "project-stuttgart-stammheim",
    title: "Stuttgart Stammheim",
    coverImageFile: "stammheim_header.jpg",
    artistStatementEn:
      "The goal of the project »Stuttgart Stammheim Prison« is a comprehensive photographic documentation of the building using large-format photography. In a first step, an exhaustive photographic documentation serves to make the current state of the building complex and its present functional compartments accessible as visual »source material« for future generations.\n\nWith a photographic survey that simultaneously draws a differentiated and realistic picture of the complex as it stands in 2009/2010, the aim is specifically to close a future collective memory gap. Analogous to my previously realised projects »Dienststelle Marienthal« and »BND Standort Pullach«, the project realisation is to take the form of a building monograph.",
    descriptionEn:
      "Stammheim does not exist in perception. Rather, the mention of the Stuttgart suburb evokes, even thirty years after the so-called Hot Autumn, an inevitable metaphorical image in collective memory that stands for the »fear syndrome of the time« (Hans Jürgen Kerner).\n\nFor a long time the pictorial reality of Stammheim has been set in concrete and overlaid by a media RAF memory culture that seeks to celebrate a national reassurance in painting (Gerhard Richter), photography (Astrid Proll), film (Bernd Eichinger) and television (Heinrich Breloer).\n\nThe starting point of the photographic-artistic project is the fact that with the planned demolition of the state prison in 2012, the concrete locality »Stammheim«, which is connected with the historical events of 1977, will be irreversibly destroyed.",
  },
  {
    id: "project-eifel",
    title: "Eifel Photographien",
    coverImageFile: "eifel_header.jpg",
    artistStatementEn:
      "The most interesting photographs today are those that no longer merely depict events, but also address methodology and perspective. The Eifel Photographs almost dissolve what is depicted. The usual pathos of landscape photography falls away and only the viewer completes the image. The meaning lies in what is not shown.",
    descriptionEn:
      "Early landscape photographs from the Eifel, taken during cycling trips through the region. Conceptually reductive — the photographs almost dissolve what is depicted and remove the conventional pathos of landscape photography. Only the viewer completes the image.",
  },
  {
    id: "project-industriephotographie",
    title: "Industriephotographie / Fabrik",
    coverImageFile: "industrie_header.jpg",
    artistStatementEn:
      "Not an industrial reportage, rather a documentation with a professional eye for detail. Whether a modern control panel or a part from the decommissioned machinery, Andreas Magdanz leaves each object its own aesthetics. And yet not a pleasing and therefore arbitrary work.",
    descriptionEn:
      "Industrial photography — not a reportage, but an aesthetic documentation of industrial objects, from modern control panels to decommissioned machinery. Each object retains its own aesthetics.",
  },
  {
    id: "project-suermondt-ludwig-museum",
    title: "Suermondt Ludwig Museum",
    coverImageFile: "suermondt_header.jpg",
    artistStatementEn:
      "Three years of construction of the new Suermondt Ludwig Museum are worthy of documentation in word and image. With Andreas Magdanz, a young artist was engaged for this commission who had tenaciously followed the genesis of the museum since the completion of the shell.",
    descriptionEn:
      "Documentary project about three years of construction of the new Suermondt Ludwig Museum in Aachen. A commissioned work accompanying the construction process from the shell to completion.",
  },
];

async function main() {
  console.log("=".repeat(65));
  console.log("Fix Project Cover Images — Andreas Magdanz Portfolio");
  console.log(`Project: ${SANITY_PROJECT_ID} | Dataset: ${SANITY_DATASET}`);
  console.log("=".repeat(65));

  let coverOk = 0;
  let enOk = 0;

  for (const proj of PROJECT_COVERS) {
    console.log(`\n[${proj.id}] ${proj.title}`);

    // 1. Upload cover image
    const assetRef = await uploadImage(proj.coverImageFile);
    if (assetRef) {
      const coverImage = {
        _type: "projectImage",
        _key: key(),
        image: { _type: "image", asset: assetRef },
        alt: `${proj.title} — Cover`,
      };
      await client.patch(proj.id).set({ coverImage }).commit();
      console.log(`  ✓ coverImage patched`);
      coverOk++;
    }

    // 2. Patch English translations
    const patch: Record<string, unknown> = {};
    if (proj.artistStatementEn) {
      patch.artistStatementEn = toPortableText(proj.artistStatementEn);
    }
    if (proj.descriptionEn) {
      patch.descriptionEn = toPortableText(proj.descriptionEn);
    }
    if (Object.keys(patch).length > 0) {
      await client.patch(proj.id).set(patch).commit();
      console.log(`  ✓ English translations patched`);
      enOk++;
    }
  }

  console.log("\n" + "=".repeat(65));
  console.log("SUMMARY");
  console.log(`  Cover images updated: ${coverOk}/${PROJECT_COVERS.length}`);
  console.log(`  English translations: ${enOk}/${PROJECT_COVERS.length}`);
  console.log("=".repeat(65));
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
