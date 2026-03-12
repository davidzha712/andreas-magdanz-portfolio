/**
 * fix-settings.ts
 *
 * Adds artist biography (DE + EN) to siteSettings and patches
 * universityInfo with German/English versions.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=<token> npx tsx fix-settings.ts
 */

import { createClient } from "@sanity/client";
import { fileURLToPath } from "url";

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

function toPortableText(text: string): Array<Record<string, unknown>> {
  return text.split(/\n\n+/).filter((p) => p.trim()).map((p) => ({
    _type: "block",
    _key: key(),
    style: "normal",
    children: [{ _type: "span", _key: key(), text: p.replace(/\n/g, " ").trim(), marks: [] }],
    markDefs: [],
  }));
}

const ARTIST_BIO_DE = `Andreas Magdanz, geboren 1964 in Mönchengladbach, ist einer der bedeutendsten deutschen Dokumentarfotografen seiner Generation. Er studierte visuelle Kommunikation in Mainz und vertiefte sein Studium an der Fachhochschule Aachen bei Prof. Wilhelm Schürmann, wo er 1991 sein Diplom erwarb.

Sein Werk ist geprägt von einer außergewöhnlichen konzeptuellen Konsequenz: In seinen großformatigen dokumentarischen Projekten widmet er sich hermetisch abgeriegelten Orten, die als Brennpunkte kollektiver Geschichte und politischer Erinnerung fungieren. Die Projekte »Dienststelle Marienthal«, »BND - Standort Pullach«, »Auschwitz-Birkenau«, »NS-Ordensburg Vogelsang« und »Stuttgart Stammheim« haben ihm internationale Anerkennung eingebracht.

Seine Photographs verbinden formale Strenge mit inhaltlicher Tiefe. Magdanz versteht Photographie nicht als bloße Dokumentation, sondern als Medium der Verdichtung: Was nicht sichtbar ist, bleibt ebenso Teil des Bildes wie das Sichtbare.

Andreas Magdanz lebt und arbeitet in Aachen. Seit 2014 ist er Professor für Photographie an der HAWK Hochschule für angewandte Wissenschaft und Kunst, Hildesheim/Holzminden/Göttingen. Er führt seit 2008 einen Lehrauftrag am Lehrstuhl für bildnerische Gestaltung und Photographie der RWTH Aachen. Seine Arbeiten befinden sich in zahlreichen öffentlichen Sammlungen; er wird international von der Gallery Janet Borden Inc., New York, vertreten.`;

const ARTIST_BIO_EN = `Andreas Magdanz, born in 1964 in Mönchengladbach, is one of Germany's most significant documentary photographers of his generation. He studied visual communication in Mainz and continued his studies at the Fachhochschule Aachen under Professor Wilhelm Schürmann, graduating with a diploma in 1991.

His work is characterised by an exceptional conceptual rigour: in his large-format documentary projects, he devotes himself to hermetically sealed sites that function as focal points of collective history and political memory. The projects »Dienststelle Marienthal«, »BND - Standort Pullach«, »Auschwitz-Birkenau«, »NS-Ordensburg Vogelsang« and »Stuttgart Stammheim« have brought him international recognition.

His photographs combine formal precision with conceptual depth. Magdanz understands photography not as mere documentation, but as a medium of condensation: what is not visible remains as much a part of the image as what is visible.

Andreas Magdanz lives and works in Aachen. Since 2014 he has been Professor of Photography at HAWK University of Applied Sciences and Arts, Hildesheim/Holzminden/Göttingen. He has held a teaching position at the Chair for Visual Design and Photography at RWTH Aachen since 2008. His works are held in numerous public collections; he is represented internationally by Gallery Janet Borden Inc., New York.`;

const TEACHING_HISTORY_DE = `Schwerpunkt Lehre: Betreuung zahlreicher studentischer Projekte und Buchpublikationen. Werkzeugmaschinen, Forschungsfabrik, Sportbecken, Kantine, Oberkante der Eifel. 2015 Hambacher Forst, eine forensische Bestandsaufnahme — 100 Studenten, 10.000 Photographs. 2014 Charleroi. 2013/14 Immerath / Hambacher Forst. 2013 Pensionnat St. Antoine. RWTH Aachen Maschinenlabor, Überfahrt (2012). Cave 719 (2012). Pflegeheim St. Franziskus, Gemünden (2009/10).`;

const TEACHING_HISTORY_EN = `Focus on teaching: supervision of numerous student projects and book publications. Machine tools, research factory, swimming pools, canteen, ridgeline of the Eifel. 2015 Hambach Forest, a forensic survey — 100 students, 10,000 photographs. 2014 Charleroi. 2013/14 Immerath / Hambach Forest. 2013 Pensionnat St. Antoine. RWTH Aachen Machine Laboratory, Überfahrt (2012). Cave 719 (2012). Nursing home St. Franziskus, Gemünden (2009/10).`;

async function main() {
  console.log("=".repeat(65));
  console.log("Fix Site Settings — Andreas Magdanz Portfolio");
  console.log("=".repeat(65));

  const patch = {
    artistBio: toPortableText(ARTIST_BIO_DE),
    artistBioEn: toPortableText(ARTIST_BIO_EN),
    teachingHistory: toPortableText(TEACHING_HISTORY_DE),
    teachingHistoryEn: toPortableText(TEACHING_HISTORY_EN),
    universityInfoEn: "HAWK University of Applied Sciences and Arts Hildesheim/Holzminden/Göttingen, Faculty of Design",
  };

  await client.patch("siteSettings").set(patch).commit();
  console.log("✓ siteSettings updated:");
  console.log(`  - artistBio: ${patch.artistBio.length} blocks`);
  console.log(`  - artistBioEn: ${patch.artistBioEn.length} blocks`);
  console.log(`  - teachingHistory: ${patch.teachingHistory.length} blocks`);
  console.log(`  - teachingHistoryEn: ${patch.teachingHistoryEn.length} blocks`);
  console.log(`  - universityInfoEn: set`);
  console.log("=".repeat(65));
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
