/**
 * patch-translations.ts
 *
 * Writes all English translations to Sanity CMS.
 * Translations were produced by Gemini 2.5 Pro.
 *
 * Usage:
 *   cd seed && npx tsx patch-translations.ts
 *   cd seed && npx tsx patch-translations.ts --dry-run
 */

import { createClient } from "@sanity/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

// ── Load env ──
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
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

if (!process.env.SANITY_API_WRITE_TOKEN) {
  console.error("Missing SANITY_API_WRITE_TOKEN");
  process.exit(1);
}

let success = 0;
let failed = 0;

async function patch(docId: string, fields: Record<string, unknown>, label: string) {
  if (DRY_RUN) {
    console.log(`  [DRY] ${label}`);
    success++;
    return;
  }
  try {
    await client.patch(docId).set(fields).commit();
    console.log(`  ✓ ${label}`);
    success++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${label}: ${msg}`);
    failed++;
  }
}

// ── Portable Text helper ──
// Takes original German blocks and translated text, returns English blocks
function translateBlocks(originalBlocks: any[], translatedText: string): any[] {
  const paragraphs = translatedText.split(/\n\n+/).filter(Boolean);
  const result = JSON.parse(JSON.stringify(originalBlocks));

  let pIdx = 0;
  for (const block of result) {
    if (block._type !== "block" || !block.children) continue;
    if (pIdx >= paragraphs.length) break;

    let para = paragraphs[pIdx];
    // Handle markdown-style headings from translation
    if (para.startsWith("## ")) {
      block.style = "h2";
      para = para.replace(/^## /, "");
    } else if (para.startsWith("### ")) {
      block.style = "h3";
      para = para.replace(/^### /, "");
    }

    if (block.children.length === 1) {
      block.children[0].text = para;
    } else {
      // Single child with all text
      const allText = para;
      block.children = [
        {
          ...block.children[0],
          text: allText,
        },
      ];
    }
    pIdx++;
  }

  return result;
}

// ══════════════════════════════════════════════════════════════
// SITE SETTINGS TRANSLATIONS
// ══════════════════════════════════════════════════════════════

const SETTINGS_TRANSLATIONS = {
  siteDescriptionEn:
    "Photography by Andreas Magdanz. Documentary and conceptual work exploring institutional memory, architecture, and historical sites.",
  universityInfoEn: "HAWK Hildesheim/Holzminden/Göttingen, Faculty of Design",
  artistBioEn_text: `## Photography as an Art of Letting the Subject Survive

Art photography, on the other hand, pursues ideas, conveys content, and condenses insights beyond the purely technical. The work of Mönchengladbach-born Andreas Magdanz is photography: convincing, of sensitive dominance, surprising, moving, yet modest, almost simple, calm. It acts as a resistance against the flood of images. It conveys complex perspectives, conscious content, and does not document in a way that is zeitgeist-conformant or commercially exploitable. It leads away from the historical evidence of an act or person. It is no longer just an appealing depiction, but expresses state of mind, aspiration, and influence. Andreas Magdanz attempts to present his experience of the environment to the viewer, to sensitize them to the subject, its own artistic background, as well as the photographer's decision.

### Political Barriers

Even during his studies, Magdanz's interest was focused on environmental and ecological issues. He worked for the Ökologisch-Demokratische Partei and represented its ideas in elections for the state parliament and the European Parliament. However, the now 29-year-old encountered barriers in politics that could not be overcome by conviction alone. This was followed by a return to photography, with shots that primarily show what he feels in the face of landscapes: meditative calm, balance.

Experience precedes photography. Important images were created during travels to the USA, Russia, Scotland, or Ireland. Likewise, Magdanz finds his subjects by looking closely at his immediate surroundings. For weeks he cycled through the Eifel, finding people and objects that prompted him to photograph, such as when landscapes open up to the view or a special light presents itself. Landscape is a significant source of motifs for the Mönchengladbach native, sometimes as a complex living space, sometimes in structures and microcosms as they are found only in the detail of trees, leaves, or ground surfaces. Magdanz captures a beauty without pathos, as it can be found with open eyes.

In the process, his photography is emotional, yet never sentimental or hurtful. For him, it is about preserving passion, not processing it voyeuristically.

### Without Gimmickry

He is concerned with credibility and authenticity—precisely with non-artificiality. Andreas Magdanz is a photographer of the tangible and the sensual. With his quiet, often intimate-seeming shots, he approaches the visual idea he has in mind. He allows much to stand, changes little, leaves the light—as the soul of photography—its own power, and does not reduce it to the function of being an indispensable technical requirement. He gives the existing light authority and meaning alongside the subject. With few fill-in effects and almost without flash, it is also about truthfulness: not agreement, posing, and manipulation take center stage. Therefore, Andreas Magdanz is one of the few photographers who dispense with novelty-seeking and gimmickry, but rather try to leave room for the viewer's imagination and memory.

— Stefan Skowron, Rheinische Post, January 2, 1993`,

  teachingHistoryEn_text: `## Teaching

### Prof. Andreas Magdanz

HAWK — Hochschule für angewandte Wissenschaft und Kunst Hildesheim/Holzminden/Göttingen, Faculty of Design (since 2005)

RWTH — Rheinisch-Westfälische Technische Hochschule, Faculty of Architecture, Visual Design

Anyone can take photographs. After all, it can be learned. Art photography, on the other hand, pursues ideas, conveys content, and condenses insights beyond the purely technical.

The photographic artist Andreas Magdanz develops his photographic bodies of work from the interaction between the medium of photography and the charged, special locations that serve as his subjects.`,
};

// ══════════════════════════════════════════════════════════════
// PROJECT TRANSLATIONS
// ══════════════════════════════════════════════════════════════

const PROJECT_TRANSLATIONS: Record<
  string,
  { artistStatementEn?: string; descriptionEn?: string }
> = {
  "project-auschwitz-birkenau": {
    artistStatementEn: `A tribute to Marceline Loridan-Ivens. It was time for me to break with tradition using color and present the site as it appears today in June: blooming vegetation, a nature that seems conciliatory, which in view of the location is peculiar and at times unbearably alienating.

The selection of images follows the route Marceline took with us — clockwise through the camp from the point of her arrival to the main gate. I have picked up on the staccato of the chimneys, fence posts, birches, and other landscape markers in relation to one another.

Above all, this small book is a tribute to Marceline Loridan-Ivens.`,
    descriptionEn: `In April 2002, French director Jerome Missolz asked me if I could imagine a photographic engagement with the Auschwitz-Birkenau concentration camp in connection with a film production. Specifically, it concerned a contribution to Marceline Loridan-Ivens' autobiographical feature film »Birkenau and Rosenfeld«, in which she, as a survivor of the concentration camp, explores the reasons for her return to this place after fifty years.

The climate of paralyzing terror and inconceivable horror that once prevailed in Auschwitz can no longer be reproduced today. It was therefore time for me to break with tradition using color and present the site as it appears today in June — blooming vegetation, a nature that seems conciliatory, which in view of the location is peculiar and at times unbearably alienating.

In the end, however, it is no more than an irritation that I am able to provide about — as Jan Philip Reemtsma once formulated it — »something that is in the world and must not be of this world«.`,
  },
  "project-bnd-pullach": {
    artistStatementEn: `The aim of the artistic project »BND - STANDORT PULLACH« by Andreas Magdanz is a comprehensive photographic documentation of the 68-hectare BND core site in Pullach. At the center of the project is the creation of a high-quality photo book, which will be published in April 2006 by the renowned Cologne publishing house DuMont. Analogous to the project »DIENSTSTELLE MARIENTHAL«, the BND documentation will be carried out on a cartographic basis to enable the recipient to orient themselves visually within the hermetically shielded site.

Like no other medium, Grossformatphotographie is suitable for condensing the history-laden subject matter both in terms of content and media on a visual level. The individual artistic achievement consists in the task of also reflecting on that which is precisely not transported as information on a visual level. The key question is: What is not visible?`,
    descriptionEn: `Even before starting its work on April 1, 1956, the Bundesnachrichtendienst (BND) was inseparably linked to the Pullach site near Munich. For decades, the Bavarian town has been synonymous with a significant and controversial chapter of German post-war history. The decision made by the security cabinet on April 10, 2003, under the leadership of Chancellor Gerhard Schröder, to relocate the secret service headquarters to Berlin, marks a profound turning point in the intelligence agency's self-understanding.

In the course of the relocation, Andreas Magdanz was presented with the historic opportunity to take aim at the history-steeped area in Pullach — which is expected to be largely abandoned in 2011 as a result of the change of location — as part of an artistic photo project, without access restrictions.`,
  },
  "project-dienststelle-marienthal": {
    artistStatementEn: `A building monograph. The name »Dienststelle Marienthal« was used for the bunker in the Ahr valley near Bonn, which was kept secret by the German government.

The artistic project follows the approach of a comprehensive photographic documentation of the underground atomic bunker facility in the medium of Grossformatfotografie. The website www.DienststelleMarienthal.de was created as an analog work to the publication.`,
    descriptionEn: `A building monograph. The name »Dienststelle Marienthal« was used for the bunker in the Ahr valley near Bonn, which was kept secret by the German government. The massive underground facility was designed as an alternative seat for the federal government in the event of an atomic attack.

Andreas Magdanz documented this hermetically sealed world photographically for the first time, creating a unique visual testimony of the Cold War. The website www.DienststelleMarienthal.de was developed to accompany the book.`,
  },
  "project-eifel": {
    artistStatementEn: `Today, the most interesting photographs are those that no longer merely depict events, but also address the approach and perspective. The Eifel photographs almost dissolve the subject. The usual pathos of landscape photography is omitted, and only the viewer completes the image. The meaning lies in what is not shown.`,
    descriptionEn: `Early landscape photographs from the Eifel region, taken during bike tours through the area. Conceptually reductive — the photographs almost dissolve the subject and remove the conventional pathos of landscape photography. Only the viewer completes the image.`,
  },
  "project-hambach-tagebau": {
    artistStatementEn: `Working title: »Photography as a mediating link between a concrete, visually experiential world and a spiritual reality«.

The work surrounding the former town of Garzweiler and the associated open-pit mine was created in 1995-96, funded by the Ministry of Science and Research, Düsseldorf, as part of the Benningsen Foerder Preis. The result is a newspaper that shows photographs of landscapes, people, and animals over 50 pages.

The theme of Rhenish lignite mining and the threatened Hambach Forest has accompanied my work for decades. In 2015, I conducted a forensic inventory of the Hambach Forest with 100 students from two universities — 10,000 images document the 700-year-old primary forest threatened by open-pit mining.`,
    descriptionEn: `Long-term documentation of Rhenish lignite mining and the Hambach Forest. The work surrounding the former town of Garzweiler and the associated open-pit mine was created in 1995-96, funded by the Ministry of Science and Research, Düsseldorf, as part of the Benningsen Foerder Preis.

The result is a newspaper showing photographs of landscapes, people, and animals over 50 pages — with an introductory text by Prof. Dr. Walter Grasskamp translated into 6 languages. The work was also accompanied by students from the FH Aachen, FB4, Photography, over 3 semesters.

In 2015, 100 students from HAWK and RWTH conducted a forensic inventory of the Hambach Forest threatened by mining. In 2018, the topic was taken up again after the temporary stop to the clearing.`,
  },
  "project-industriephotographie": {
    artistStatementEn: `Not industrial reportage, but rather a documentation with a professional eye for detail. Whether it is a modern control desk or a part from the discarded machinery, Andreas Magdanz leaves each object its own aesthetic. And yet, it is not a pleasing and thus arbitrary work.`,
    descriptionEn: `Industrial photography — not reportage, but an aesthetic documentation of industrial objects, from modern control desks to discarded machinery. Each object retains its own aesthetic.`,
  },
  "project-stuttgart-stammheim": {
    artistStatementEn: `The aim of the project »Justizvollzugsanstalt Stammheim« is a comprehensive visual documentation of the building in the medium of Grossformatfotografie. In a first step, an exhaustive photographic record serves to make the current state of the building area and its present functional compartments tangible and usable as visual »source material« for future generations in the first place.

With a photographic inventory that simultaneously draws a differentiated and realistic picture of the facility in its 2009/2010 state, a future collective memory gap is to be specifically closed. Analogous to my previously realized projects »Dienststelle Marienthal« and »BND Standort Pullach«, the project is to be realized in the form of a building monograph.`,
    descriptionEn: `Stammheim does not exist in perception. Rather, the mention of the Stuttgart suburb, even thirty years after the so-called 'German Autumn' (Heisser Herbst), inevitably evokes a metaphorical idea in the collective memory that stands for the »fear syndrome of the time« (Hans Jürgen Kerner).

For a long time, the visual reality of Stammheim has been cemented and overlaid by a media-driven RAF memory culture that seeks to celebrate a national reassurance in painting (Gerhard Richter), photography (Astrid Proll), film (Bernd Eichinger), and television (Heinrich Breloer).

The starting point of the photographic art project is the fact that with the planned demolition of the state prison in 2012, the specific location »Stammheim«, which is connected to the historical events of 1977, will be irrevocably destroyed.`,
  },
  "project-suermondt-ludwig-museum": {
    artistStatementEn: `Three years of construction of the New Suermondt Ludwig Museum are worth documenting in writing and images. With Andreas Magdanz, a young artist was won for this commission, who had tenaciously followed the museum's emergence since the completion of the shell.`,
    descriptionEn: `Documentary project covering three years of construction of the new Suermondt Ludwig Museum in Aachen. A commissioned work that accompanies the construction process from the shell to completion.`,
  },
  "project-vogelsang": {
    artistStatementEn: `The aim of the VOGELSANG project is a comprehensive visual documentation of Camp Vogelsang using the medium of Grossformatfotografie. The structure of the VOGELSANG work follows a tripartite division that captures the substantial parameters of the military training area: NATURE, ARCHITECTURE, MILITARY. In addition to the individual analysis of the three thematic areas, the overall project pursues the objective of showing the natural, architectural, and military elements of the site in their complex mutual entanglements and relationships.`,
    descriptionEn: `At the latest with the opening of the Eifel National Park on January 1, 2004, the military area of Vogelsang came into the public focus nationwide. In the controversial discussion about the future civilian use of the former Nazi 'Ordensburg', which exhibits paradigmatic features in dealing with the National Socialist heritage, one central aspect has so far received only marginal attention. It is the fact that with the withdrawal of the Belgian armed forces on January 1, 2006, a significant chapter of post-war German occupation history will come to an irrevocable end.

The starting point of the artistic project VOGELSANG is the guiding principle that the historical essence of the Vogelsang site lies precisely in the military use of the formerly ideologically led training facility by the Belgian troops.

Over a period of 54 years, the approximately 4,200-hectare site was fundamentally adapted as a military training area to the specific requirements of the democratic victorious power of the neighboring state. The takeover took place in several steps and affects all aspects of the facility in its very different consequences, both in the concrete functional and ideological areas. Consequently, numerous traces of the complex process of appropriation in Vogelsang are readable today on both cultural and natural relics.`,
  },
};

// ══════════════════════════════════════════════════════════════
// CV ENTRY TRANSLATIONS
// ══════════════════════════════════════════════════════════════

const CV_TRANSLATIONS: Record<string, { titleEn: string; descriptionEn?: string | null }> = {
  "cv-1": { titleEn: "Professorship in Photography" },
  "cv-2": { titleEn: "Lectureship, Chair of Visual Design, Photography" },
  "cv-3": { titleEn: "Lectureship, Department 4, Photography" },
  "cv-4": { titleEn: "Diploma" },
  "cv-5": { titleEn: "Continuation of studies, focus on Photography with Prof. Wilhelm Schürmann" },
  "cv-6": { titleEn: "Studies of Visual Communication" },
  "cv-7": { titleEn: "Abitur" },
  "cv-8": { titleEn: "born in Mönchengladbach" },
  "cv-9": { titleEn: "Hambacher Forst, a forensic inventory" },
  "cv-10": { titleEn: "Hambacher Forst, a forensic inventory" },
  "cv-11": { titleEn: "Artist Talk" },
  "cv-12": { titleEn: "Artist Talk" },
  "cv-13": { titleEn: "Stuttgart Stammheim" },
  "cv-14": { titleEn: "Camp Vogelsang" },
  "cv-15": { titleEn: "Vogelsang, van Dooren, Vogelsang" },
  "cv-16": { titleEn: "BND Standort Pullach" },
  "cv-17": { titleEn: "Dienststelle Marienthal" },
  "cv-18": { titleEn: "Imaging the Distance" },
  "cv-19": { titleEn: "Dienststelle Marienthal / BND Pullach" },
  "cv-20": { titleEn: "Imaging the Distance" },
  "cv-21": { titleEn: "Auschwitz-Birkenau" },
  "cv-22": { titleEn: "Paris Photo" },
  "cv-23": { titleEn: "Les Rencontres de la Photographie" },
  "cv-24": { titleEn: "Lecture" },
  "cv-25": { titleEn: "Paris Photo" },
  "cv-26": { titleEn: "Lecture" },
  "cv-27": { titleEn: "Dienststelle Marienthal" },
  "cv-28": { titleEn: "Frankfurt Book Fair" },
  "cv-29": { titleEn: "Shipping Hall" },
  "cv-30": { titleEn: "Exhibition" },
  "cv-31": { titleEn: "Exhibition, New Building" },
  "cv-32": { titleEn: "Exhibition" },
  "cv-33": { titleEn: "Exhibition" },
  "cv-34": { titleEn: "Exhibition" },
  "cv-35": { titleEn: "Group and Solo Exhibitions with glass objects and photographs" },
  "cv-36": { titleEn: "Photographie Contemporain Euregional (PCE)" },
  "cv-37": { titleEn: "Carte Blanche IV, Schutzraum, Baukunstwerk Fronleichnam von Rudolf Schwarz" },
  "cv-38": { titleEn: "Group Exhibition" },
  "cv-39": { titleEn: "Group Exhibition" },
  "cv-40": { titleEn: "Group Exhibition" },
  "cv-41": { titleEn: "Group Exhibition" },
  "cv-42": { titleEn: "Group Exhibition" },
  "cv-43": { titleEn: "Building the Unthinkable" },
  "cv-44": { titleEn: "Group Exhibition" },
  "cv-45": { titleEn: "Kongress Erde" },
  "cv-46": { titleEn: "Group Exhibition" },
  "cv-47": { titleEn: "Biennale" },
  "cv-48": { titleEn: "Group Exhibition" },
  "cv-49": { titleEn: "Group Exhibition" },
  "cv-50": { titleEn: "Die Anderen Zehn" },
  "cv-51": { titleEn: "Group Exhibition" },
  "cv-52": { titleEn: "Immerath / Hambacher Forst, book on demand, student project" },
  "cv-53": { titleEn: "Pensionnat St. Antoine, book on demand, student project" },
  "cv-54": { titleEn: "Hans und Grete, Images of the RAF, 1967-77, MagBook" },
  "cv-55": { titleEn: "Stuttgart Stammheim (Print Hatje Cantz / MagBook (eBook) 2013)" },
  "cv-56": { titleEn: "JVA Stammheim, semester project RWTH Aachen (MagBook 2011)" },
  "cv-57": { titleEn: "Camp Vogelsang, Musée Royal de l'Armée (Print/MagBook 2010)" },
  "cv-58": { titleEn: "BND-Standort Pullach (Print DuMont 2006 / MagBook 2011)" },
  "cv-59": { titleEn: "Auschwitz-Birkenau, Hommage à Marceline Loridan-Ivens (Book)" },
  "cv-60": { titleEn: "Dienststelle Marienthal - a building monograph (Book self-published 2000 / MagBook 2009)" },
  "cv-61": { titleEn: "Garzweiler (on newsprint)" },
  "cv-62": { titleEn: "Andreas Magdanz - Photograph (Catalogue)" },
  "cv-63": { titleEn: "Lindt & Sprüngli Chocoladefabriken (Book/Print)" },
  "cv-64": { titleEn: "Eifel (Book/Unique edition)" },
  "cv-65": { titleEn: "Imaging the Distance (Catalogue)" },
  "cv-66": { titleEn: "Der Regierungsbunker (Catalogue)" },
  "cv-67": { titleEn: "Catalogue Schürmann Collection" },
  "cv-68": { titleEn: "Bauhaus und Brasilia, Auschwitz und Hiroshima, Edition Bauhaus, Volume 12" },
  "cv-69": { titleEn: "Publication Series Forum / Volume 11" },
  "cv-70": { titleEn: "Yearbook" },
  "cv-71": { titleEn: "Catalogue Rencontres de la Photographie" },
  "cv-72": { titleEn: "Catalogue" },
  "cv-73": { titleEn: "Raum für Kunst (Catalogue)" },
  "cv-74": { titleEn: "Catalogue" },
  "cv-75": { titleEn: "Catalogue" },
  "cv-76": { titleEn: "Catalogue" },
  "cv-77": { titleEn: "Catalogue" },
  "cv-78": { titleEn: "Grant for the project Das Spanische Dorf" },
  "cv-79": { titleEn: "Grant for the exhibition Stuttgart Stammheim" },
  "cv-80": { titleEn: "Grant for the project Vogelsang" },
  "cv-81": { titleEn: "Grant for the project Vogelsang" },
  "cv-82": { titleEn: "Research Grant as part of the Benningsen-Foerder Prize" },
  "cv-83": { titleEn: "Encouragement Award of the City of Aachen, Purchase by the City for the new Suermondt Ludwig Museum" },
  "cv-84": { titleEn: "Pictures in Public" },
  "cv-85": { titleEn: "Pictures in Public" },
  "cv-86": { titleEn: "Pictures in Public" },
  "cv-87": { titleEn: "Pictures in Public" },
  "cv-88": { titleEn: "Pictures in Public" },
  "cv-89": { titleEn: "Pictures in Public" },
  "cv-90": { titleEn: "Pictures in Public" },
  "cv-91": { titleEn: "Pictures in Public" },
  "cv-92": { titleEn: "Pictures in Public" },
};

// ══════════════════════════════════════════════════════════════
// MEDIA DESCRIPTION TRANSLATIONS
// ══════════════════════════════════════════════════════════════

const MEDIA_TRANSLATIONS: Record<string, string> = {
  "media-p03": `Spiegel Online\n\n15.11.2012\n\nPhoto Research in Death Row\n\nBy Michael Sontheimer\n\nDisturbing images from the darkness of collective memory: Stuttgart-Stammheim prison became world-famous as the place where RAF prisoners died. Photographer Andreas Magdanz has now spent months documenting the building, shortly before its demolition. His pictures show the banality of the high-security wing.`,
  "media-p04": `Neue Züricher Zeitung\n\n7. Januar 2013\n\nHigh Security in Times of Terror\n\nby Joachim Güntner\n\nThe first generation of the Red Army Faction died in the Stuttgart-Stammheim correctional facility. That was also where they stood trial. The courtroom and high-security wing are scheduled for demolition. The photographer Andreas Magdanz has documented the complex in a series of oppressive images.`,
  "media-p05": `art, Das Kunstmagazin\n\n20.11.2012\n\nANDREAS MAGDANZ, STUTTGART\n\nby ADRIENNE BRAUN\n\nBEFORE THE WRECKING BALL ARRIVES\n\nThe Stammheim photographs by Andreas Magdanz at the Kunstmuseum Stuttgart show an almost mythical place of the old Federal Republic in large format – before the RAF wing is demolished in 2013.`,
  "media-p07": `Goethe-Institut e. V.\n\nFebruary 2013\n\nVisual Arts in Germany:\n\nExhibition reviews, Artist portraits\n\nStammheim for Eternity – Andreas Magdanz\n\nby Cornelia Ganitta\n\nThrough the incarceration of leaders of the terrorist group Red Army Faction (RAF), the Stuttgart-Stammheim prison attained a dubious kind of immortality. Andreas Magdanz has approached this site with his camera, creating a historical record that goes beyond mere documentation.`,
  "media-p08": `Pictures at the Hotel Armageddon\n\nBy RICHARD B. WOODWARD\n\nPublished: January 11, 2004\n\nIn the final minutes of the movie »Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb,« with a nuclear conflagration on the horizon, the only person in the Pentagon's war room who remains upbeat is the title character. He suggests that the elite members of the government and military move into deep mine shafts, where they can wait out the centuries of radiation.\n\nStrangelove's perverse fantasy of survival in a hole was close to the reality of the Cold War, as Andreas Magdanz demonstrates in his photographic study of the West German government's secret bunker at Marienthal.`,
  "media-p09": `International Herald Tribune\n\nTuesday, August 28, 2001, No. 199\n\nCathedrals of the Cold War\n\nNoah's Ark and the Dismantling of History: The West German Government's Secret Bunker\n\nBy Andreas Rossmann\n\nA cool breeze wafts through this historical site. Photographer Andreas Magdanz has captured the eerie silence and the technological fossilization of this subterranean world.`,
  "media-p10": `FAZ\n\nSaturday, August 18, 2001\n\nCathedral of the Cold War\n\nHistory Disposal: Government Bunker in the Ahr Valley\n\nBy Andreas Rossmann\n\nA cool breeze envelops the entrant. Just moments ago, idle sunshine prevailed. But here, behind massive iron gates, lies the "Alternative Seat of the Federal Constitutional Organs." Andreas Magdanz has documented this monument to the Cold War before its final decommissioning.`,
  "media-p11": `SPIEGEL ONLINE\n\n18.07.2006\n\nThe Bavarian Civil Servant Bond\n\nBy Ralf Hanselle\n\nFor around five decades, the small Munich suburb of Pullach has been a mystery-shrouded white spot on the map. In a photo book, photographer Andreas Magdanz exposes the headquarters of the Federal Intelligence Service (BND) as an ordinary administrative complex, stripped of its mythological veil through the sober lens of a large-format camera.`,
  "media-p12": `Frankfurter Allgemeine\n\n19.05.2006\n\nA Blend of the Extreme and the Banal\n\nBy Christian Geyer\n\nIt is an authority, it is an authority! Gone is all the mythology. A secret service site where one is allowed to take photos has essentially given up its symbolic capital. This is the finding of Andreas Magdanz's work on Pullach.`,
  "media-p13": `DIE WELT\n\n16.05.2006\n\nNot a Soul in Pullach\n\nThe BND may still be producing scandals, but photographer Andreas Magdanz has long since transformed it into art\n\nBy Eckhard Fuhr\n\nBefore us lies a white book of a special kind. The federal eagle is embossed on the white cardboard cover. Magdanz captures the BND headquarters in Pullach at a moment of transition, portraying an architecture of secrecy that is both haunting and surprisingly mundane.`,
  "media-p15": `Berliner Zeitung\n\n22.05.2006\n\nIndividual Security Access System\n\nBy Christian Esch\n\nPhotographer Andreas Magdanz penetrates into the interior of the BND center in Pullach and finds a lot of emptiness. Decades later, Magdanz documents the site's unique atmosphere—a mixture of post-war suburban idyll and high-tech surveillance.`,
  "media-p16": `TAZ\n\nSociety + Culture, May 11, 2016\n\nPatient Forest Near Death\n\nForensic Photographs Against the Destruction of the Hambacher Forst\n\nFrom the ceiling hang 2,500 images of various sizes, like a giant mobile. On the wall, large-scale photographs – and everything is about the forest. Andreas Magdanz uses the methods of forensic photography to capture the Hambach Forest before it falls victim to lignite mining.`,
  "media-p17": `taz\n\n26.03.2013\n\nWashable Architectural Modernism\n\nby Lennart Laberenz\n\nPHOTOGRAPHY Andreas Magdanz examines the offices and barracks rooms of power, the architecture of discipline — now that the Stammheim high-security prison is scheduled for demolition next year. Through his series, Magdanz explores the surfaces of the prison, revealing an architecture designed to contain, now standing as a silent witness to a turbulent chapter of German history.`,
  "media-p18": `Photonews\n\nApril 2004\n\nAndreas Magdanz\n\nAuschwitz-Birkenau\n\nHommage à Marceline Loridan-Ivens\n\nby Peter Lindhorst\n\nOpened, set aside, paced around, pulled out again. The small, friendly-looking book by Andreas Magdanz, adorned with its inviting cover on which white daisies shine out from a dark green. The idyll proliferating on the cover continues in Magdanz's work on Auschwitz-Birkenau. The gaze is guided from the detail to the wide shot. Young foxes frolic in the warm sunlight, a pond slumbers peacefully. These seem to be the most remote of all places, whose untouched nature is contradicted by the remaining stone witnesses of a former efficient death machine.`,
  "media-p19": `TAZ\n\nMarch 2001\n\nAndreas Magdanz - Dienststelle Marienthal\n\nBy Renate Puhvogel\n\nLiterally just before the last act, a photographic testimony comes to the fore, which with rare consistency documents the "Alternative Seat of the Federal Constitutional Organs" — the government bunker in the Ahr valley near Bonn. Andreas Magdanz has captured an underground world hermetically sealed from the outside in sober, powerful images. The result is an impressive documentation that makes clear how closely the un-aesthetic of concrete, the dreary connecting passages, and the kitschy design of the 70s approached each other.`,
  "media-p20": `WWW.TELEPOLIS.DE\n\n30 March 2001\n\nThe Madness of Nuclear War Games\n\nBy Michael Klarmann\n\nPhotographer Andreas Magdanz on a monstrosity carved in stone\n\nThe idyll in the Ahr Valley between Ahrweiler and Dernau was deceptive. Under the code name "Dienststelle Marienthal," the "Alternative Seat of the Federal Constitutional Organs" was located here in the middle of the slate rock. Against the desire to forget, Andreas Magdanz sets art: an impressive photo book, an exhibition, film recordings, and the website he designed.`,
};

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n🌐 Patching English translations to Sanity CMS`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  // ── 1. Site Settings ──
  console.log("── Site Settings ──");
  const settings = await client.fetch(`*[_type == "siteSettings"][0]{_id, artistBio, teachingHistory}`);
  if (settings) {
    const artistBioEn = translateBlocks(settings.artistBio, SETTINGS_TRANSLATIONS.artistBioEn_text);
    const teachingHistoryEn = translateBlocks(settings.teachingHistory, SETTINGS_TRANSLATIONS.teachingHistoryEn_text);

    await patch(settings._id, {
      siteDescriptionEn: SETTINGS_TRANSLATIONS.siteDescriptionEn,
      universityInfoEn: SETTINGS_TRANSLATIONS.universityInfoEn,
      artistBioEn,
      teachingHistoryEn,
    }, "siteSettings (4 fields)");
  }

  // ── 2. Projects ──
  console.log("\n── Projects ──");
  const projects = await client.fetch(`*[_type == "project"]{_id, artistStatement, description}`);
  for (const proj of projects) {
    const trans = PROJECT_TRANSLATIONS[proj._id];
    if (!trans) continue;

    const fields: Record<string, unknown> = {};
    if (trans.artistStatementEn && proj.artistStatement?.length > 0) {
      fields.artistStatementEn = translateBlocks(proj.artistStatement, trans.artistStatementEn);
    }
    if (trans.descriptionEn && proj.description?.length > 0) {
      fields.descriptionEn = translateBlocks(proj.description, trans.descriptionEn);
    }
    if (Object.keys(fields).length > 0) {
      await patch(proj._id, fields, `project: ${proj._id}`);
    }
  }

  // ── 3. CV Entries ──
  console.log("\n── CV Entries ──");
  for (const [id, trans] of Object.entries(CV_TRANSLATIONS)) {
    const fields: Record<string, unknown> = { titleEn: trans.titleEn };
    if (trans.descriptionEn) fields.descriptionEn = trans.descriptionEn;
    await patch(id, fields, `cv: ${id} → ${trans.titleEn}`);
  }

  // ── 4. Exhibition countries ──
  console.log("\n── Exhibition Countries ──");
  const exhibitions = await client.fetch(`*[_type == "exhibition"]{_id, country, countryEn}`);
  for (const ex of exhibitions) {
    if (ex.country && !ex.countryEn) {
      await patch(ex._id, { countryEn: ex.country }, `exhibition: ${ex._id} → ${ex.country}`);
    }
  }

  // ── 5. Media descriptions ──
  console.log("\n── Media Descriptions ──");
  const mediaItems = await client.fetch(`*[_type == "mediaItem" && defined(description)]{_id, title, description, descriptionEn}`);
  for (const item of mediaItems) {
    if (item.descriptionEn?.length > 0) continue;
    const trans = MEDIA_TRANSLATIONS[item._id];
    if (!trans) continue;

    const descriptionEn = translateBlocks(item.description, trans);
    await patch(item._id, { descriptionEn }, `media: ${item._id}`);
  }

  // ── Summary ──
  console.log("\n" + "─".repeat(50));
  console.log(`Done. Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
