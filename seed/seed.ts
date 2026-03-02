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
// Helpers
// ---------------------------------------------------------------------------

let keyCounter = 0;
function key(): string {
  keyCounter += 1;
  return `k${keyCounter.toString(36).padStart(6, "0")}`;
}

/** Convert plain text into Portable Text block array, splitting on double newlines for paragraphs. */
function toPortableText(
  text: string,
  style: "normal" | "h2" | "h3" | "blockquote" = "normal",
): Array<Record<string, unknown>> {
  if (!text || !text.trim()) return [];
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  return paragraphs.map((p) => ({
    _type: "block",
    _key: key(),
    style,
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

/** Upload an image from the local seed/images directory and return an asset reference. */
async function uploadImage(
  sanity: SanityClient,
  filename: string,
): Promise<{ _type: "reference"; _ref: string } | null> {
  const imagePath = path.join(__dirname, "images", filename);
  if (!fs.existsSync(imagePath)) {
    console.warn(`  [WARN] Image not found: ${imagePath}`);
    return null;
  }
  try {
    const asset = await sanity.assets.upload("image", fs.createReadStream(imagePath), {
      filename,
    });
    return { _type: "reference", _ref: asset._id };
  } catch (err) {
    console.warn(`  [WARN] Failed to upload ${filename}:`, (err as Error).message);
    return null;
  }
}

/** Build a projectImage object for the Sanity schema. */
function projectImage(
  assetRef: { _type: "reference"; _ref: string },
  alt: string,
  caption?: string,
): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    _type: "projectImage",
    _key: key(),
    image: {
      _type: "image",
      asset: assetRef,
    },
    alt,
  };
  if (caption) obj.caption = caption;
  return obj;
}

/** Slugify a title. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parse German date strings like "13. Apr. 2023" or "März 2008" into ISO date. */
function parseGermanDate(dateStr: string): string {
  if (!dateStr) return "2000-01-01";

  const monthMap: Record<string, string> = {
    jan: "01", januar: "01", january: "01",
    feb: "02", februar: "02", february: "02",
    mär: "03", maer: "03", märz: "03", march: "03",
    apr: "04", april: "04",
    mai: "05", may: "05",
    jun: "06", juni: "06", june: "06",
    jul: "07", juli: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", sept: "09", september: "09",
    okt: "10", oktober: "10", october: "10",
    nov: "11", november: "11",
    dez: "12", dezember: "12", december: "12",
    spring: "04",
  };

  // Try ISO-ish formats first
  const isoMatch = dateStr.match(/^(\d{4})[/-](\d{1,2})(?:[/-](\d{1,2}))?/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3] ? isoMatch[3].padStart(2, "0") : "01";
    return `${y}-${m}-${d}`;
  }

  // Handle "2002/2003" style
  const rangeMatch = dateStr.match(/(\d{4})\/(\d{4})/);
  if (rangeMatch) return `${rangeMatch[1]}-01-01`;

  // Handle German format: "13. Apr. 2023", "März 2008", "May 19th, 2006", etc.
  const cleaned = dateStr.replace(/\./g, "").replace(/,/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  const parts = cleaned.split(" ").filter(Boolean);

  let day = "01";
  let month = "01";
  let year = "2000";

  for (const p of parts) {
    // Year
    if (/^\d{4}$/.test(p)) {
      year = p;
      continue;
    }
    // Day number
    if (/^\d{1,2}(st|nd|rd|th)?$/.test(p)) {
      day = p.replace(/\D/g, "").padStart(2, "0");
      continue;
    }
    // Month name
    const monthKey = Object.keys(monthMap).find(
      (k) => p === k || p.startsWith(k),
    );
    if (monthKey) {
      month = monthMap[monthKey];
      continue;
    }
  }

  // Fallback: try to find a year anywhere in the string
  if (year === "2000") {
    const yearMatch = dateStr.match(/(\d{4})/);
    if (yearMatch) year = yearMatch[1];
  }

  return `${year}-${month}-${day}`;
}

/** Construct a full URL from a relative path on the old site. */
function oldSiteUrl(relativePath: string): string {
  if (relativePath.startsWith("http")) return relativePath;
  return OLD_SITE_BASE + relativePath.replace(/^\//, "");
}

function log(section: string, msg: string) {
  console.log(`[${section}] ${msg}`);
}

// ---------------------------------------------------------------------------
// Image Cache — upload once, reuse asset refs
// ---------------------------------------------------------------------------

const imageCache = new Map<string, { _type: "reference"; _ref: string }>();

async function getImageRef(
  sanity: SanityClient,
  filename: string,
): Promise<{ _type: "reference"; _ref: string } | null> {
  if (imageCache.has(filename)) return imageCache.get(filename)!;
  const ref = await uploadImage(sanity, filename);
  if (ref) imageCache.set(filename, ref);
  return ref;
}

// ---------------------------------------------------------------------------
// 1. PROJECTS
// ---------------------------------------------------------------------------

interface ProjectDef {
  id: string;
  title: string;
  slug: string;
  year: string;
  location?: string;
  isFeatured: boolean;
  order: number;
  coverImageFile: string;
  headerImageFile?: string;
  detailImageFiles?: string[];
  artistStatement: string;
  description: string;
}

const PROJECTS: ProjectDef[] = [
  {
    id: "project-vogelsang",
    title: "Vogelsang",
    slug: "vogelsang",
    year: "2007-2010",
    location: "Eifel, Germany",
    isFeatured: false,
    order: 1,
    coverImageFile: "vogelsang_cover.jpg",
    headerImageFile: "vogelsang_header.jpg",
    detailImageFiles: ["vogelsang_img1.jpg", "vogelsang_img2.jpg"],
    artistStatement:
      "Ziel des Projekts VOGELSANG ist eine umfassende Bilddokumentation des Camp Vogelsang mit dem Medium der Grossformatfotografie. Der Aufbau der Arbeit VOGELSANG folgt einer Dreigliederung, die die substantiellen Parameter des Truppenübungsplatzes erfasst: NATUR, ARCHITEKTUR, MILIT\u00c4R. Neben der Einzelanalyse der drei Themenbereiche verfolgt das Gesamtprojekt die Zielsetzung, die nat\u00fcrlichen, architektonischen und milit\u00e4rischen Elemente des Gel\u00e4ndes in ihren komplexen wechselseitigen Verflechtungen und Bez\u00fcgen aufzuzeigen.",
    description:
      "Sp\u00e4testens mit der Er\u00f6ffnung des Nationalparks Eifel zum 1. Januar 2004 ist das milit\u00e4risch genutzte Areal Vogelsang bundesweit in den Fokus der \u00d6ffentlichkeit ger\u00fcckt. In der kontrovers gef\u00fchrten Diskussion um die zuk\u00fcnftige zivile Nutzung der ehemaligen NS-Ordensburg, die im Umgang mit der nationalsozialistischen Erblast durchaus paradigmatische Z\u00fcge aufweist, hat ein zentraler Aspekt bisher nur marginal Beachtung gefunden. Es handelt sich um das Faktum, dass mit dem Abzug der belgischen Streitkr\u00e4fte zum 1. Januar 2006 ein bedeutendes Kapitel deutscher Besatzungsgeschichte der Nachkriegszeit unwiderruflich enden wird.\n\nAusgangspunkt des k\u00fcnstlerischen Projekts VOGELSANG ist der Leitgedanke, dass die historische Essenz der \u00d6rtlichkeit Vogelsang gerade in der milit\u00e4rischen Nutzung der ehemals ideologisch gef\u00fchrten Schulungsst\u00e4tte durch die belgischen Truppenverb\u00e4nde liegt.\n\nIn einem Zeitraum von 54 Jahren ist das ca. 4.200 ha umfassende Gel\u00e4nde als Truppen\u00fcbungsplatz grundlegend auf die konkreten Anforderungen der demokratischen Siegermacht des Nachbarstaats angepasst worden. Die \u00dcbernahme erfolgte hierbei in mehreren Schritten und betrifft in ihren sehr unterschiedlichen Auswirkungen alle Aspekte der Anlage im konkreten funktionalen wie weltanschaulichen Bereich. Folglich sind heute zahlreiche Spuren des komplexen Aneignungsprozesses in Vogelsang sowohl an kulturellen als auch an nat\u00fcrlichen Relikten ablesbar.",
  },
  {
    id: "project-bnd-pullach",
    title: "BND - Standort Pullach",
    slug: "bnd-standort-pullach",
    year: "2003-2006",
    location: "Pullach bei M\u00fcnchen, Germany",
    isFeatured: true,
    order: 2,
    coverImageFile: "bnd_cover.jpg",
    headerImageFile: "bnd_header.jpg",
    detailImageFiles: ["bnd_img1.jpg", "bnd_img2.jpg"],
    artistStatement:
      "Ziel des k\u00fcnstlerischen Projekts \u00bbBND - STANDORT PULLACH\u00ab von Andreas Magdanz ist eine umfassende photographische Dokumentation des 68 Hektar grossen BND-Kerngel\u00e4ndes in Pullach. Im Zentrum des Projekts steht die Erstellung eines hochwertigen Photobuchs, das im April 2006 im renommierten K\u00f6lner Verlagshaus DuMont erscheinen wird. In Analogie zu dem Projekt \u00bbDIENSTSTELLE MARIENTHAL\u00ab wird die BND-Dokumentation nach kartografischen Grundlagen erfolgen, um dem Rezipienten auf visueller Ebene eine Orientierung des hermetisch abgeschirmten Gel\u00e4ndes zu erm\u00f6glichen.\n\nWie kein anderes Medium ist hierbei die Grossformatphotographie geeignet, die geschichtsbelastete Thematik auf visueller Ebene inhaltlich wie medial zu verdichten. Die einzelne k\u00fcnstlerische Bildleistung besteht demnach in der Aufgabe, auch dasjenige, was auf visueller Ebene an Information gerade nicht transportiert wird, mit zu reflektieren. Die Schl\u00fcsselfrage lautet also: Was ist nicht sichtbar?",
    description:
      "Bereits vor Aufnahme seiner T\u00e4tigkeit am 1. April 1956 war der Bundesnachrichtendienst (BND) untrennbar mit dem Standort Pullach bei M\u00fcnchen verkn\u00fcpft. Die bayerische Ortschaft steht seit Dekaden synonym f\u00fcr ein bedeutendes wie streitbares Kapitel deutscher Nachkriegsgeschichte. Der am 10. April 2003 unter Leitung von Bundeskanzler Gerhard Schr\u00f6der getroffene Beschluss des Sicherheitskabinetts, die Geheimdienstzentrale nach Berlin zu verlegen, bedeutet eine tief greifende Z\u00e4sur im Selbstverst\u00e4ndnis der Aufkl\u00e4rungsbeh\u00f6rde.\n\nIm Zuge der Umzugsmassnahme bot sich Andreas Magdanz nun die historische M\u00f6glichkeit, das geschichtstr\u00e4chtige Areal in Pullach, das als Folge des Standortwechsels voraussichtlich 2011 weitgehend aufgegeben wird, im Rahmen eines k\u00fcnstlerischen Photoprojekts, ohne Zugangsbeschr\u00e4nkungen ins Visier zu nehmen.",
  },
  {
    id: "project-auschwitz-birkenau",
    title: "Auschwitz-Birkenau",
    slug: "auschwitz-birkenau",
    year: "2002-2003",
    location: "O\u015bwi\u0119cim, Poland",
    isFeatured: true,
    order: 3,
    coverImageFile: "auschwitz_cover.jpg",
    headerImageFile: "auschwitz_header.jpg",
    detailImageFiles: ["auschwitz_img1.jpg", "auschwitz_img2.jpg"],
    artistStatement:
      "Eine Hommage an Marceline Loridan-Ivens. Es war f\u00fcr mich an der Zeit, mit Farbe diese Tradition zu brechen und den Ort so zu pr\u00e4sentieren, wie er sich heute im Juni zeigt, eine bl\u00fchende Vegetation, eine vers\u00f6hnlich wirkende Natur, die in Anbetracht der St\u00e4tte eigent\u00fcmlich, teilweise unertr\u00e4glich befremdet.\n\nDie Bildauswahl folgt der Strecke, die Marceline mit uns gegangen war \u2014 von der Stelle ihrer Ankunft im Uhrzeigersinn durch das Lager bis zum Haupttor. Aufgegriffen habe ich dabei das Stakkato der Schornsteine, Zaunpfeiler, Birken und anderer Landschaftsmarken zueinander.\n\nVor allem ist dieses kleine Buch eine Hommage an Marceline Loridan-Ivens.",
    description:
      "Der franz\u00f6sische Regisseur Jerome Missolz fragte mich im April 2002, ob ich mir im Zusammenhang mit einer Filmproduktion die photographische Auseinandersetzung mit dem Konzentrationslager Auschwitz-Birkenau vorstellen k\u00f6nnte. Konkret ging es um einen Beitrag zu Marceline Loridan-Ivens autobiographischem Spielfilm \u00bbBirkenau und Rosenfeld\u00ab, in dem sie als \u00dcberlebende des Konzentrationslagers die Gr\u00fcnde ihrer R\u00fcckkehr an diesen Ort nach f\u00fcnfzig Jahren thematisiert.\n\nDas Klima von l\u00e4hmendem Terror und unfassbarem Schrecken, das in Auschwitz einmal herrschte, kann heute niemand mehr reproduzieren. Es war daher f\u00fcr mich an der Zeit, mit Farbe diese Tradition zu brechen und den Ort so zu pr\u00e4sentieren, wie er sich heute im Juni zeigt \u2014 eine bl\u00fchende Vegetation, eine vers\u00f6hnlich wirkende Natur, die in Anbetracht der St\u00e4tte eigent\u00fcmlich, teilweise unertr\u00e4glich befremdet.\n\nEs ist am Ende allerdings auch nicht mehr als eine Irritation, die ich zu leisten vermag \u00fcber \u2014 wie Jan Philip Reemtsma es einmal formuliert hat \u2014 \u00bbetwas das in der Welt ist und nicht von dieser Welt sein darf\u00ab.",
  },
  {
    id: "project-dienststelle-marienthal",
    title: "Dienststelle Marienthal",
    slug: "dienststelle-marienthal",
    year: "2000-2002",
    location: "Ahrtal bei Bonn, Germany",
    isFeatured: true,
    order: 4,
    coverImageFile: "marienthal_cover.jpg",
    artistStatement:
      "Eine Geb\u00e4udemonographie. Mit dem Namen \u00bbDienststelle Marienthal\u00ab wurde der von der Bundesregierung geheim gehaltene Bunker im Ahrtal bei Bonn bezeichnet.\n\nDas k\u00fcnstlerische Projekt verfolgt den Ansatz einer umfassenden photographischen Dokumentation der unterirdischen Atombunkeranlage im Medium der Grossformatfotografie. Als Analogwerk zu der Publikation wurde die Webseite www.DienststelleMarienthal.de erstellt.",
    description:
      "Eine Geb\u00e4udemonographie. Mit dem Namen \u00bbDienststelle Marienthal\u00ab wurde der von der Bundesregierung geheim gehaltene Bunker im Ahrtal bei Bonn bezeichnet. Die riesige unterirdische Anlage war als Ausweichsitz der Bundesregierung f\u00fcr den Fall eines atomaren Angriffs konzipiert.\n\nAndreas Magdanz dokumentierte diese hermetisch abgeriegelte Welt erstmals photographisch und schuf damit ein einzigartiges visuelles Zeugnis des Kalten Krieges. Begleitend zum Buch ist die Webseite www.DienststelleMarienthal.de entstanden.",
  },
  {
    id: "project-hambach-tagebau",
    title: "Hambach / Tagebau",
    slug: "hambach-tagebau",
    year: "1997-2018",
    location: "Nordrhein-Westfalen, Germany",
    isFeatured: false,
    order: 5,
    coverImageFile: "hambach_cover.jpg",
    headerImageFile: "garzweiler_header.jpg",
    detailImageFiles: ["garzweiler_img1.jpg", "garzweiler_img2.jpg"],
    artistStatement:
      "Arbeitstitel: \u00bbPhotographie als Vermittlungsleitung zwischen einer gegenst\u00e4ndlichen, visuell erfahrbaren Welt und einer geistigen Wirklichkeit\u00ab.\n\nDie Arbeit um den ehemaligen Ort Garzweiler und den damit verbundenen Tagebau entstand in den Jahren 1995-96, gef\u00f6rdert durch das Ministerium f\u00fcr Wissenschaft und Forschung, D\u00fcsseldorf, im Rahmen des Benningsen Foerder Preises. Das Ergebnis ist eine Zeitung, die auf \u00fcber 50 Seiten Photographien von Landschaft, Menschen und Tieren zeigt.\n\nDas Thema des rheinischen Braunkohle-Tagebaus und des bedrohten Hambacher Forstes begleitet meine Arbeit seit Jahrzehnten. 2015 f\u00fchrte ich mit 100 Studenten zweier Hochschulen eine forensische Bestandsaufnahme des Hambacher Forstes durch \u2014 10.000 Bilder dokumentieren den durch den Tagebau bedrohten 700 Jahre alten Prim\u00e4rwald.",
    description:
      "Langzeitdokumentation des rheinischen Braunkohle-Tagebaus und des Hambacher Forstes. Die Arbeit um den ehemaligen Ort Garzweiler und den damit verbundenen Tagebau entstand in den Jahren 1995-96, gef\u00f6rdert durch das Ministerium f\u00fcr Wissenschaft und Forschung, D\u00fcsseldorf, im Rahmen des Benningsen Foerder Preises.\n\nDas Ergebnis ist eine Zeitung, die auf \u00fcber 50 Seiten Photographien von Landschaft, Menschen und Tieren zeigt \u2014 mit einem in 6 Sprachen \u00fcbersetzten Eingangstext von Prof. Dr. Walter Grasskamp. Die Arbeit wurde auch von Studenten der FH Aachen, FB4, Photographie, \u00fcber 3 Semester begleitet.\n\n2015 f\u00fchrten 100 Studenten der HAWK und der RWTH eine forensische Bestandsaufnahme des durch den Tagebau bedrohten Hambacher Forstes durch. 2018 wurde das Thema erneut aufgegriffen nach dem einstweiligen Rodungsstop.",
  },
  {
    id: "project-stuttgart-stammheim",
    title: "Stuttgart Stammheim",
    slug: "stuttgart-stammheim",
    year: "2009-2012",
    location: "Stuttgart, Germany",
    isFeatured: true,
    order: 6,
    coverImageFile: "stammheim_cover.jpg",
    headerImageFile: "stammheim_header.jpg",
    artistStatement:
      "Ziel des Projekts \u00bbJustizvollzugsanstalt Stammheim\u00ab ist eine umfassende Bilddokumentation des Geb\u00e4udes im Medium der Grossformatfotografie. In einem ersten Schritt dient eine ersch\u00f6pfende bilddokumentarische Erfassung dazu, den derzeitigen Zustand des Geb\u00e4udeareals und seiner jetzigen funktionalen Kompartimente als visuelles \u00bbQuellenmaterial\u00ab f\u00fcr zuk\u00fcnftige Generationen \u00fcberhaupt erst fass- und nutzbar zu machen.\n\nMit einer fotografischen Bestandsaufnahme, die zugleich ein differenziertes und wirklichkeitsgerechtes Bild der Anlage im Zustand des Jahres 2009/2010 zeichnet, soll gezielt eine zuk\u00fcnftige kollektive Erinnerungsl\u00fccke geschlossen werden. Analog zu meinen bisher realisierten Projekten \u00bbDienststelle Marienthal\u00ab und \u00bbBND Standort Pullach\u00ab soll die Projektrealisierung in Form einer Geb\u00e4udemonografie erfolgen.",
    description:
      "Stammheim existiert in der Anschauung nicht. Vielmehr evoziert die Nennung des Stuttgarter Vortortes auch dreissig Jahre nach dem sog. Heissen Herbst im kollektiven Ged\u00e4chtnis unweigerlich eine metaphorische Vorstellung, die f\u00fcr das \u00bbFurchtsyndrom der Zeit\u00ab (Hans J\u00fcrgen Kerner) steht.\n\nSeit langem ist die bildhafte Realit\u00e4t von Stammheim einzementiert und von einer medialen RAF-Erinnerungskultur \u00fcberlagert, die in Malerei (Gerhard Richter), in der Fotografie (Astrid Proll), im Film (Bernd Eichinger) und im Fernsehen (Heinrich Breloer) eine nationale R\u00fcckvergewisserung zu zelebrieren sucht.\n\nAusgangspunkt des fotok\u00fcnstlerischen Projekts ist die Tatsache, dass mit dem geplanten Abbruch des Staatsgef\u00e4ngnisses im Jahr 2012 die konkrete \u00d6rtlichkeit \u00bbStammheim\u00ab, die mit den historischen Ereignissen von 1977 verbunden ist, unwiderruflich zerst\u00f6rt werden wird.",
  },
  {
    id: "project-eifel",
    title: "Eifel Photographien",
    slug: "eifel-photographien",
    year: "1990-1993",
    location: "Eifel, Germany",
    isFeatured: false,
    order: 7,
    coverImageFile: "eifel_cover.jpg",
    artistStatement:
      "Die Photographien sind heute die Interessantesten, die nicht mehr lediglich Ereignisse abbilden, sondern auch Vorgehensweise und Betrachtungsweise mit thematisieren. Die Eifel Photographien l\u00f6sen das Abgebildete beinahe auf. Das \u00fcbliche Pathos der Landschaftsaufnahme entf\u00e4llt und erst der Betrachter komplettiert das Bild. Die Bedeutung liegt in dem was nicht gezeigt wird.",
    description:
      "Fr\u00fche Landschaftsphotographien aus der Eifel, entstanden w\u00e4hrend Radtouren durch die Region. Konzeptuell reduktiv \u2014 die Photographien l\u00f6sen das Abgebildete beinahe auf und entfernen das konventionelle Pathos der Landschaftsaufnahme. Erst der Betrachter komplettiert das Bild.",
  },
  {
    id: "project-industriephotographie",
    title: "Industriephotographie / Fabrik",
    slug: "industriephotographie",
    year: "ca. 1995-2000",
    location: "Germany",
    isFeatured: false,
    order: 8,
    coverImageFile: "industrie_cover.jpg",
    artistStatement:
      "Keine Industriereportage, eher eine Dokumentation mit dem professionellen Blick f\u00fcr das Detail. Gleich ob modernes Schaltpult oder ein Teil aus dem ausrangierten Maschinenpark, Andreas Magdanz bel\u00e4sst jedem Gegenstand die ihm eigene \u00c4sthetik. Und trotzdem keine gef\u00e4llige und damit beliebige Arbeit.",
    description:
      "Industriephotographie \u2014 keine Reportage, sondern eine \u00e4sthetische Dokumentation industrieller Objekte, von modernen Schaltpulten bis zu ausrangiertem Maschinenpark. Jeder Gegenstand beh\u00e4lt seine eigene \u00c4sthetik.",
  },
  {
    id: "project-suermondt-ludwig-museum",
    title: "Suermondt Ludwig Museum",
    slug: "suermondt-ludwig-museum",
    year: "ca. 1993-1996",
    location: "Aachen, Germany",
    isFeatured: false,
    order: 9,
    coverImageFile: "suermondt_cover.jpg",
    artistStatement:
      "Drei Jahre Bauzeit des Neuen Suermondt Ludwig Museums sind der Dokumentation in Schrift und Bild wert. Mit Andreas Magdanz wurde ein junger K\u00fcnstler f\u00fcr diesen Auftrag gewonnen, der mit Z\u00e4higkeit das Entstehen des Museums seit der Fertigstellung des Rohbaus verfolgt hatte.",
    description:
      "Dokumentarisches Projekt \u00fcber drei Jahre Bauzeit des neuen Suermondt Ludwig Museums in Aachen. Eine Auftragsarbeit, die den Bauprozess vom Rohbau bis zur Fertigstellung begleitet.",
  },
];

async function seedProjects(sanity: SanityClient): Promise<void> {
  log("PROJECTS", `Seeding ${PROJECTS.length} projects...`);

  for (const proj of PROJECTS) {
    log("PROJECTS", `  Creating "${proj.title}"...`);

    // Upload cover image
    const coverRef = await getImageRef(sanity, proj.coverImageFile);
    if (!coverRef) {
      log("PROJECTS", `  [SKIP] No cover image for ${proj.title}`);
      continue;
    }

    // Upload additional images
    const images: Array<Record<string, unknown>> = [];

    if (proj.headerImageFile) {
      const headerRef = await getImageRef(sanity, proj.headerImageFile);
      if (headerRef) {
        images.push(projectImage(headerRef, `${proj.title} - Header`, `${proj.title} header image`));
      }
    }

    if (proj.detailImageFiles) {
      for (let i = 0; i < proj.detailImageFiles.length; i++) {
        const detailRef = await getImageRef(sanity, proj.detailImageFiles[i]);
        if (detailRef) {
          images.push(
            projectImage(detailRef, `${proj.title} - Detail ${i + 1}`, `${proj.title} detail image ${i + 1}`),
          );
        }
      }
    }

    const doc: Record<string, unknown> = {
      _id: proj.id,
      _type: "project",
      title: proj.title,
      slug: { _type: "slug", current: proj.slug },
      coverImage: projectImage(coverRef, `${proj.title} - Cover`, `${proj.title} cover image`),
      images,
      year: proj.year,
      isFeatured: proj.isFeatured,
      order: proj.order,
      artistStatement: toPortableText(proj.artistStatement),
      description: toPortableText(proj.description),
    };

    if (proj.location) doc.location = proj.location;

    await sanity.createOrReplace(doc as any);
    log("PROJECTS", `  Created "${proj.title}"`);
  }
}

// ---------------------------------------------------------------------------
// 2. CV ENTRIES
// ---------------------------------------------------------------------------

interface CVEntryData {
  category: string;
  year: number;
  endYear: number | null;
  title: string;
  institution: string | null;
  location: string | null;
}

const CV_ENTRIES: CVEntryData[] = [
  // --- Teaching ---
  { category: "teaching", year: 2014, endYear: null, title: "Professur f\u00fcr Photographie", institution: "HAWK, Hochschule f\u00fcr angewandte Wissenschaft und Kunst", location: "Hildesheim/Holzminden/G\u00f6ttingen" },
  { category: "teaching", year: 2008, endYear: null, title: "Lehrauftrag, Lehrstuhl f\u00fcr bildnerische Gestaltung, Photographie", institution: "RWTH Aachen", location: "Aachen" },
  { category: "teaching", year: 1994, endYear: 1997, title: "Lehrauftrag, Fachbereich 4, Photographie", institution: "Fachhochschule Aachen", location: "Aachen" },
  // --- Education ---
  { category: "education", year: 1991, endYear: null, title: "Diplom", institution: null, location: "Aachen" },
  { category: "education", year: 1988, endYear: 1991, title: "Fortf\u00fchrung des Studiums, Schwerpunkt Photographie bei Prof. Wilhelm Sch\u00fcrmann", institution: "Fachhochschule Aachen", location: "Aachen" },
  { category: "education", year: 1987, endYear: 1988, title: "Studium der visuellen Kommunikation", institution: null, location: "Mainz" },
  { category: "education", year: 1984, endYear: null, title: "Abitur", institution: null, location: "Rheydt" },
  { category: "education", year: 1963, endYear: null, title: "geboren in M\u00f6nchengladbach", institution: null, location: "M\u00f6nchengladbach" },
  // --- Solo Exhibitions ---
  { category: "soloExhibition", year: 2016, endYear: null, title: "Hambacher Forst, eine forensische Bestandsaufnahme", institution: "Rasselmaina", location: "Hildesheim" },
  { category: "soloExhibition", year: 2016, endYear: null, title: "Hambacher Forst, eine forensische Bestandsaufnahme", institution: "Nadelfabrik", location: "Aachen" },
  { category: "soloExhibition", year: 2013, endYear: null, title: "K\u00fcnstlergespr\u00e4ch", institution: "Museum Kurhaus Kleve", location: "Kleve" },
  { category: "soloExhibition", year: 2013, endYear: null, title: "K\u00fcnstlergespr\u00e4ch", institution: "Kunsthalle D\u00fcsseldorf", location: "D\u00fcsseldorf" },
  { category: "soloExhibition", year: 2012, endYear: 2013, title: "Stuttgart Stammheim", institution: "Kunstmuseum Stuttgart", location: "Stuttgart" },
  { category: "soloExhibition", year: 2010, endYear: null, title: "Camp Vogelsang", institution: "Mus\u00e9e Royal de l'Arm\u00e9e", location: "Br\u00fcssel" },
  { category: "soloExhibition", year: 2008, endYear: null, title: "Vogelsang, van Dooren, Vogelsang", institution: null, location: null },
  { category: "soloExhibition", year: 2008, endYear: null, title: "BND Standort Pullach", institution: "Ludwig Forum f\u00fcr Internationale Kunst", location: "Aachen" },
  { category: "soloExhibition", year: 2008, endYear: null, title: "Dienststelle Marienthal", institution: "Einstein Forum", location: "Potsdam" },
  { category: "soloExhibition", year: 2007, endYear: null, title: "Imaging the Distance", institution: "Ludwig Forum f\u00fcr Internationale Kunst", location: "Aachen" },
  { category: "soloExhibition", year: 2007, endYear: null, title: "Dienststelle Marienthal / BND Pullach", institution: "Gallery Janet Borden, Inc.", location: "New York" },
  { category: "soloExhibition", year: 2007, endYear: null, title: "Imaging the Distance", institution: "Arlington Arts Center", location: "Virginia" },
  { category: "soloExhibition", year: 2004, endYear: null, title: "Auschwitz-Birkenau", institution: "Gallery Janet Borden, Inc.", location: "New York" },
  { category: "soloExhibition", year: 2002, endYear: null, title: "Paris Photo", institution: "Gallery Janet Borden, Inc.", location: "Paris" },
  { category: "soloExhibition", year: 2002, endYear: null, title: "Les Rencontres de la Photographie", institution: null, location: "Arles" },
  { category: "soloExhibition", year: 2002, endYear: null, title: "Vortrag", institution: "Einstein Forum", location: "Potsdam" },
  { category: "soloExhibition", year: 2001, endYear: null, title: "Paris Photo", institution: "Carrousel du Louvre", location: "Paris" },
  { category: "soloExhibition", year: 2001, endYear: null, title: "Vortrag", institution: "Ausw\u00e4rtiges Amt, Aus- und Fortbildungsst\u00e4tte", location: "Bonn" },
  { category: "soloExhibition", year: 2001, endYear: null, title: "Dienststelle Marienthal", institution: "Rheinisches Landesmuseum", location: "Bonn" },
  { category: "soloExhibition", year: 2000, endYear: null, title: "Frankfurter Buchmesse", institution: null, location: "Frankfurt" },
  { category: "soloExhibition", year: 1998, endYear: null, title: "Versandhalle", institution: null, location: "Grevenbroich" },
  { category: "soloExhibition", year: 1998, endYear: null, title: "Ausstellung", institution: "Raum f\u00fcr Kunst", location: "Aachen" },
  { category: "soloExhibition", year: 1994, endYear: null, title: "Ausstellung, Neubau", institution: "Suermondt Ludwig Museum", location: "Aachen" },
  { category: "soloExhibition", year: 1994, endYear: null, title: "Ausstellung", institution: "Stadtsparkasse M\u00f6nchengladbach", location: "M\u00f6nchengladbach" },
  { category: "soloExhibition", year: 1993, endYear: null, title: "Ausstellung", institution: "Kreuzgang des Aachener Doms", location: "Aachen" },
  { category: "soloExhibition", year: 1992, endYear: null, title: "Ausstellung", institution: "Suermondt Ludwig Museum", location: "Aachen" },
  { category: "soloExhibition", year: 1984, endYear: 1987, title: "Gruppen- und Einzelausstellungen mit Glasobjekten und Photographien", institution: null, location: null },
  // --- Group Exhibitions ---
  { category: "groupExhibition", year: 2015, endYear: null, title: "Photographie Contemporain Euregional (PCE)", institution: "Centre Wallon d'Art contemporain", location: null },
  { category: "groupExhibition", year: 2014, endYear: null, title: "Carte Blanche IV, Schutzraum, Baukunstwerk Fronleichnam von Rudolf Schwarz", institution: null, location: null },
  { category: "groupExhibition", year: 2010, endYear: null, title: "Gruppenausstellung", institution: "San Francisco Museum of Modern Art", location: "San Francisco" },
  { category: "groupExhibition", year: 2010, endYear: null, title: "Gruppenausstellung", institution: "Tate Modern", location: "London" },
  { category: "groupExhibition", year: 2010, endYear: null, title: "Gruppenausstellung", institution: "Loftgalerie", location: "Berlin" },
  { category: "groupExhibition", year: 2010, endYear: null, title: "Gruppenausstellung", institution: "St. Frohnleichnam", location: "Aachen" },
  { category: "groupExhibition", year: 2006, endYear: null, title: "Gruppenausstellung", institution: "Museum of Photography Antwerp", location: "Antwerpen, Belgien" },
  { category: "groupExhibition", year: 2004, endYear: null, title: "Building the Unthinkable", institution: "Apex Art Gallery", location: "New York" },
  { category: "groupExhibition", year: 2004, endYear: null, title: "Gruppenausstellung", institution: "Friedenskirche", location: "Eschweiler" },
  { category: "groupExhibition", year: 2001, endYear: null, title: "Kongress Erde", institution: "Kunst- und Ausstellungshalle der Bundesrepublik", location: "Bonn" },
  { category: "groupExhibition", year: 2000, endYear: null, title: "Gruppenausstellung", institution: "Ludwig Forum f\u00fcr internationale Kunst", location: "Aachen" },
  { category: "groupExhibition", year: 1997, endYear: null, title: "Biennale", institution: "Mus\u00e9e d'Art Moderne", location: "Li\u00e8ge" },
  { category: "groupExhibition", year: 1996, endYear: null, title: "Gruppenausstellung", institution: "Haarener M\u00fchle", location: "Haaren" },
  { category: "groupExhibition", year: 1991, endYear: null, title: "Gruppenausstellung", institution: "Karl-Ernst-Osthaus Museum", location: "Hagen" },
  { category: "groupExhibition", year: 1990, endYear: null, title: "Die Anderen Zehn", institution: "Aachener Kunstverein", location: "Aachen" },
  { category: "groupExhibition", year: 1990, endYear: null, title: "Gruppenausstellung", institution: "Wissenschaftszentrum", location: "Bonn" },
  // --- Publications ---
  { category: "publication", year: 2014, endYear: null, title: "Immerath / Hambacher Forst, book on demand, studentisches Projekt", institution: null, location: null },
  { category: "publication", year: 2013, endYear: null, title: "Pensionnat St. Antoine, book on demand, studentisches Projekt", institution: null, location: null },
  { category: "publication", year: 2012, endYear: null, title: "Hans und Grete, Bilder der RAF, 1967-77, MagBook", institution: null, location: null },
  { category: "publication", year: 2012, endYear: null, title: "Stuttgart Stammheim (Print Hatje Cantz / MagBook (eBook) 2013)", institution: null, location: null },
  { category: "publication", year: 2011, endYear: null, title: "JVA Stammheim, Semesterprojekt RWTH Aachen (MagBook 2011)", institution: null, location: null },
  { category: "publication", year: 2010, endYear: null, title: "Camp Vogelsang, Mus\u00e9e Royal de l'Arm\u00e9e (Print/MagBook 2010)", institution: null, location: null },
  { category: "publication", year: 2006, endYear: null, title: "BND-Standort Pullach (Print DuMont 2006 / MagBook 2011)", institution: null, location: null },
  { category: "publication", year: 2003, endYear: null, title: "Auschwitz-Birkenau, Hommage \u00e0 Marceline Loridan-Ivens (Buch)", institution: null, location: null },
  { category: "publication", year: 2000, endYear: null, title: "Dienststelle Marienthal - eine Geb\u00e4udemonographie (Buch Selbstverlag 2000 / MagBook 2009)", institution: null, location: null },
  { category: "publication", year: 1997, endYear: null, title: "Garzweiler (auf Zeitungspapier)", institution: null, location: null },
  { category: "publication", year: 1994, endYear: null, title: "Andreas Magdanz - Photograph (Katalog)", institution: null, location: null },
  { category: "publication", year: 1992, endYear: null, title: "Lindt & Spr\u00fcngli Chocoladefabriken (Buch/Print)", institution: null, location: null },
  { category: "publication", year: 1991, endYear: null, title: "Eifel (Buch/Unikat)", institution: null, location: null },
  { category: "publication", year: 2007, endYear: null, title: "Imaging the Distance (Katalog)", institution: "Arlington Arts Center, Virginia / Ludwig Forum, Aachen", location: null },
  { category: "publication", year: 2007, endYear: null, title: "Der Regierungsbunker (Katalog)", institution: "Bundesamt f\u00fcr Bauwesen und Raumordnung", location: null },
  { category: "publication", year: 2004, endYear: null, title: "Katalog Sammlung Sch\u00fcrmann", institution: "SK-Stiftung", location: "K\u00f6ln" },
  { category: "publication", year: 2003, endYear: null, title: "Bauhaus und Brasilia, Auschwitz und Hiroshima, Edition Bauhaus, Band 12", institution: null, location: null },
  { category: "publication", year: 2002, endYear: null, title: "Schriftenreihe Forum / Band 11", institution: "Kunst- und Ausstellungshalle der BRD", location: null },
  { category: "publication", year: 2002, endYear: null, title: "Jahrbuch", institution: "Bundesamt f\u00fcr Bauwesen und Raumordnung", location: null },
  { category: "publication", year: 2002, endYear: null, title: "Katalog Rencontres de la Photographie", institution: null, location: "Arles" },
  { category: "publication", year: 2001, endYear: null, title: "Katalog", institution: "Rheinisches Landesmuseum", location: "Bonn" },
  { category: "publication", year: 1998, endYear: null, title: "Raum f\u00fcr Kunst (Katalog)", institution: "Stadtsparkasse Aachen", location: "Aachen" },
  { category: "publication", year: 1997, endYear: null, title: "Katalog", institution: "Mus\u00e9e d'Art Moderne", location: "Li\u00e8ge" },
  { category: "publication", year: 1996, endYear: null, title: "Katalog", institution: "Haarener M\u00fchle", location: "Haaren" },
  { category: "publication", year: 1994, endYear: null, title: "Katalog", institution: "Suermondt Ludwig Museum", location: "Aachen" },
  { category: "publication", year: 1991, endYear: null, title: "Katalog", institution: "Karl-Ernst-Osthaus Museum", location: "Hagen" },
  // --- Grants ---
  { category: "grant", year: 2017, endYear: null, title: "F\u00f6rderung f\u00fcr das Projekt Das Spanische Dorf", institution: "Kunststiftung NRW", location: null },
  { category: "grant", year: 2011, endYear: null, title: "F\u00f6rderung f\u00fcr die Ausstellung Stuttgart Stammheim", institution: "Stiftung Baden-W\u00fcrttemberg", location: null },
  { category: "grant", year: 2008, endYear: null, title: "F\u00f6rderung f\u00fcr das Projekt Vogelsang", institution: "Staatskanzlei NRW", location: null },
  { category: "grant", year: 2007, endYear: null, title: "F\u00f6rderung f\u00fcr das Projekt Vogelsang", institution: "Kunststiftung NRW", location: null },
  // --- Awards ---
  { category: "award", year: 1996, endYear: null, title: "Wissenschaftsf\u00f6rderung im Rahmen des Benningsen-Foerder Preises", institution: "Ministerium f\u00fcr Wissenschaft und Forschung", location: "D\u00fcsseldorf" },
  { category: "award", year: 1993, endYear: null, title: "F\u00f6rderpreis der Stadt Aachen, Ankauf der Stadt f\u00fcr das neue Suermondt Ludwig Museum", institution: "Stadt Aachen", location: "Aachen" },
  // --- Collections ---
  { category: "collection", year: 2013, endYear: null, title: "Pictures in Public", institution: "Stiftung Haus der Geschichte der Bundesrepublik Deutschland", location: "Bonn" },
  { category: "collection", year: 2008, endYear: null, title: "Pictures in Public", institution: "Sammlung Ludwig", location: "Aachen" },
  { category: "collection", year: 2008, endYear: null, title: "Pictures in Public", institution: "Museum of Modern Art", location: "San Francisco" },
  { category: "collection", year: 2007, endYear: null, title: "Pictures in Public", institution: "The Metropolitan Museum of Art", location: "New York City" },
  { category: "collection", year: 2004, endYear: null, title: "Pictures in Public", institution: "Microsoft", location: "New York City" },
  { category: "collection", year: 2004, endYear: null, title: "Pictures in Public", institution: "Yale University Art Gallery", location: "New Haven" },
  { category: "collection", year: 2004, endYear: null, title: "Pictures in Public", institution: "Princeton Museum", location: "Princeton" },
  { category: "collection", year: 2004, endYear: null, title: "Pictures in Public", institution: "Museum of Modern Art", location: "San Francisco" },
  { category: "collection", year: 2004, endYear: null, title: "Pictures in Public", institution: "Metropolitan Museum", location: "New York City" },
];

async function seedCVEntries(sanity: SanityClient): Promise<void> {
  log("CV", `Seeding ${CV_ENTRIES.length} CV entries...`);

  for (let i = 0; i < CV_ENTRIES.length; i++) {
    const entry = CV_ENTRIES[i];
    const doc: Record<string, unknown> = {
      _id: `cv-${i + 1}`,
      _type: "cvEntry",
      category: entry.category,
      year: entry.year,
      title: entry.title,
    };
    if (entry.endYear) doc.endYear = entry.endYear;
    if (entry.institution) doc.institution = entry.institution;
    if (entry.location) doc.location = entry.location;

    await sanity.createOrReplace(doc as any);
  }

  log("CV", `Created ${CV_ENTRIES.length} CV entries.`);
}

// ---------------------------------------------------------------------------
// 3. MEDIA ITEMS
// ---------------------------------------------------------------------------

interface MediaItemData {
  id: string;
  title: string;
  mediaType: "video" | "audio" | "press";
  source: string;
  date: string; // German date string
  embedUrl?: string;
  externalUrl?: string;
}

const MEDIA_ITEMS: MediaItemData[] = [
  // === VIDEOS (all 20) ===
  { id: "media-v01", title: "Abschied von Stammheim", mediaType: "video", source: "3sat - Kulturzeit", date: "13. Apr. 2023", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=3sat_kuz_230413_stammheim.mp4" },
  { id: "media-v02", title: "Der Regierungsbunker - In den Tiefen der Geschichte", mediaType: "video", source: "3sat - Kulturzeit", date: "19. Jan. 2023", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=3sat_kuz_20230119_mag-regbu_sd.mp4" },
  { id: "media-v03", title: "mit dem Fotografen Andreas Magdanz in den Hambacher Forst", mediaType: "video", source: "arte - Twist", date: "17. Jan. 2021", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=arte-twist-der-wald_210117.mp4" },
  { id: "media-v04", title: "Vernissage im KUK der St\u00e4dteRegion Aachen", mediaType: "video", source: "KUK", date: "29. Sept. 2019", embedUrl: "https://www.youtube.com/watch?v=joI1pq0O2dI" },
  { id: "media-v05", title: "\u00dcberfahrt Maschinenlabor, Making-of", mediaType: "video", source: "Making-of \u00dcberfahrt Maschinenlabor", date: "24. Sept. 2019", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=rwth-maschinenlabor_making-of_720.mp4" },
  { id: "media-v06", title: "RWTH Aachen, EMU, \u00dcberfahrt Maschinenlabor mit Interview", mediaType: "video", source: "\u00dcberfahrt Maschinenlabor", date: "24. Sept. 2019", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=rwth-maschinenlabor-ueberfahrt_720.mp4" },
  { id: "media-v07", title: "Hambacher Forst - eine studentische Bestandsaufnahme", mediaType: "video", source: "ARD TTT Titel Thesen Temperamente", date: "23. Sept. 2018", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=ttt_180923_magdanz_hambacher-forst.mp4" },
  { id: "media-v08", title: "Studiogast Andreas Magdanz", mediaType: "video", source: "WDR WestArt", date: "25. April 2016", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=wdr_westart_20160425_magdanz_studiogast.mp4" },
  { id: "media-v09", title: "Hambacher Forst, eine Waldbelichtung", mediaType: "video", source: "3sat Kulturzeit", date: "23. Juni 2015", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=3sat_kulturzeit_20150623.mp4" },
  { id: "media-v10", title: "Magdanz, Stammheim", mediaType: "video", source: "Deutsche Welle TV", date: "13. April 2013", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=dwtv_kultur21_120413_en.mp4" },
  { id: "media-v11", title: "Mythos Stammheim", mediaType: "video", source: "3sat - Kulturzeit", date: "27. Juni 2012", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=3sat-kultur_120627.mp4" },
  { id: "media-v12", title: "Brussels III - Visit of King Albert II", mediaType: "video", source: "Visit of King Albert II", date: "07. Mai 2010", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=brus_3_leroi.mp4" },
  { id: "media-v13", title: "Vogelsang", mediaType: "video", source: "WDR - west.art", date: "09. Okt. 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=wdr_westart_081009.mp4" },
  { id: "media-v14", title: "Camp Vogelsang: Fotos von Andreas Magdanz", mediaType: "video", source: "BRF - Blickpunkt (BE)", date: "05. Sept. 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=brf_blickp_080905.mp4" },
  { id: "media-v15", title: "Photograph arbeitet an Vogelsang-Bildband", mediaType: "video", source: "WDR Lokalzeit", date: "17. Mai 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=wdr_lokalzeit-ac_080517.mp4" },
  { id: "media-v16", title: "Interview", mediaType: "video", source: "ARD - hier und heute", date: "01. M\u00e4rz 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=ard-hierundheute_0803.mp4" },
  { id: "media-v17", title: "Interview", mediaType: "video", source: "SWR - Landesart", date: "01. M\u00e4rz 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=swr-landesart_0803.mp4" },
  { id: "media-v18", title: "Interview", mediaType: "video", source: "ZDF - heute", date: "01. M\u00e4rz 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=zdf-heute_0803.mp4" },
  { id: "media-v19", title: "Interview", mediaType: "video", source: "ZDF - Mittagsmagazin", date: "01. M\u00e4rz 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=zdf-mittagsmagazin_0803.mp4" },
  { id: "media-v20", title: "Bunker-Museum, Interview", mediaType: "video", source: "ARD - Titel Thesen Temperamente", date: "17. Feb. 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6002&media=ttt_mthal_080217.mp4" },
  // === AUDIO (all 13) ===
  { id: "media-a01", title: "Fotograf Andreas Magdanz erkundet die RWTH Aachen", mediaType: "audio", source: "WDR5 - Scala", date: "08. Aug. 2019", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=wdr5_scala_20190808_magdanz-erkundet-die-rwth.mp3" },
  { id: "media-a02", title: "Economy meets Art - Ein Projekt des Fotografen Andreas Magdanz", mediaType: "audio", source: "WDR3 Mosaik", date: "29. Juli 2019", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=wdr3_mosaik_20190729_economymeetsart.mp3" },
  { id: "media-a03", title: "Mahnmal gegen die Vernichtung eines Waldes", mediaType: "audio", source: "WDR5 Scala", date: "17. Okt. 2018", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=wdr5_scala_dichter_181017_mahnmal.mp3" },
  { id: "media-a04", title: "Mit dem Fotografen Andreas Magdanz unterwegs im Hambacher Forst", mediaType: "audio", source: "WDR5 Scala", date: "29. Juli 2015", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=wdr5_scala_20150729_magdanz_hambacher-forst.mp3" },
  { id: "media-a05", title: "Stammheim in Bildern", mediaType: "audio", source: "WDR3", date: "04. Dezember 2012", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=wdr3_resonanzen_biermann_121204.mp3" },
  { id: "media-a06", title: "JVA Stammheim", mediaType: "audio", source: "WDR5 - Scala", date: "11. Januar 2011", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=wdr5_scala_dichter_110111.mp3" },
  { id: "media-a07", title: "Vogelsang, Interview", mediaType: "audio", source: "BRF - Forum (BE)", date: "27. Juli 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=brf_forum_080727.mp3" },
  { id: "media-a08", title: "Naziburg durch die Augen eines K\u00fcnstlers: Andreas Magdanz fotografiert Vogelsang", mediaType: "audio", source: "Deutschlandradio Kultur", date: "18. Juli 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=dlrk_080718.mp3" },
  { id: "media-a09", title: "Burg im Wandel", mediaType: "audio", source: "WDR 2 - Die Kritiker", date: "18. Juli 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=wdr2_dichter_080718.mp3" },
  { id: "media-a10", title: "NS-Vergangenheit im Nationalpark", mediaType: "audio", source: "WDR 3 - Mosaik", date: "18. Juli 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=wdr3_mosaik_20080718.mp3" },
  { id: "media-a11", title: "Streng geheim! Interview", mediaType: "audio", source: "WDR 3 - Resonanzen", date: "17. Juli 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=wdr3_resonanzen_20080717.mp3" },
  { id: "media-a12", title: "Interview", mediaType: "audio", source: "Deutschlandfunk, Corso - Kultur nach 3", date: "29. Feb. 2008", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=dlfunk_corso_marienthal_080229.mp3" },
  { id: "media-a13", title: "Interview", mediaType: "audio", source: "Deutschlandfunk - Kulturzeit", date: "16. Mai 2006", embedUrl: "http://www.andreasmagdanz.de/index.php?id=6003&media=dlfunk_dkultur_200605161609.mp3" },
  // === PRESS (top ~20 most notable articles) ===
  { id: "media-p01", title: "Zur\u00fcck im Bunker", mediaType: "press", source: "General-Anzeiger", date: "02. Feb. 2023", externalUrl: "http://www.andreasmagdanz.de/content/presse/txt/genanz_230201_zurueck-im-bunker.pdf" },
  { id: "media-p02", title: "Waldesruh, ...der Totschlag am Hambacher Forst", mediaType: "press", source: "S\u00fcddeutsche Zeitung", date: "13. Okt. 2018", externalUrl: "http://www.andreasmagdanz.de/content/presse/txt/sz_181013_waldesruh.pdf" },
  { id: "media-p03", title: "Fotorecherche im Todestrakt", mediaType: "press", source: "Spiegel Online", date: "15. November 2012", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=spon_11-2012.txt" },
  { id: "media-p04", title: "Hochsicherheit in Zeiten des Terrors", mediaType: "press", source: "Neue Z\u00fcricher Zeitung", date: "07. Januar 2013", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=nzz_2-2013.txt" },
  { id: "media-p05", title: "ANDREAS MAGDANZ STUTTGART STAMMHEIM", mediaType: "press", source: "art, Das Kunstmagazin", date: "20. November 2012", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=artmag_11-2012.txt" },
  { id: "media-p06", title: "Andreas Magdanz, Stuttgart Stammheim", mediaType: "press", source: "OSMOS", date: "01. M\u00e4rz 2013", externalUrl: "http://www.andreasmagdanz.de/content/presse/txt/OSMOS_1-2013_Magdanz_Stammheim.pdf" },
  { id: "media-p07", title: "Stammheim f\u00fcr die Ewigkeit \u2014 Andreas Magdanz", mediaType: "press", source: "Goethe-Institut e. V.", date: "01. Februar 2013", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=goethe_2-2013.txt" },
  { id: "media-p08", title: "Pictures at the Hotel Armageddon", mediaType: "press", source: "New York Times", date: "01. Januar 2004", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=nyt01-2004_en.txt" },
  { id: "media-p09", title: "Cathedrals of the Cold War", mediaType: "press", source: "International Herald Tribune", date: "28. August 2001", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=ht08-2001.txt" },
  { id: "media-p10", title: "Kathedrale des Kalten Krieges", mediaType: "press", source: "FAZ", date: "18. August 2001", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=faz08-2001.txt" },
  { id: "media-p11", title: "Bayerischer Beamten-Bond", mediaType: "press", source: "SPIEGEL ONLINE", date: "18. Juli 2006", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=sp07-2006.txt" },
  { id: "media-p12", title: "Eine Mischung aus Krassem und Banalem", mediaType: "press", source: "Frankfurter Allgemeine", date: "19. Mai 2006", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=faz05-2006.txt" },
  { id: "media-p13", title: "Keine Menschenseele in Pullach", mediaType: "press", source: "DIE WELT", date: "16. Mai 2006", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=wel05-2006.txt" },
  { id: "media-p14", title: "Geheime Orte der Republik", mediaType: "press", source: "Welt am Sonntag", date: "10. August 2008", externalUrl: "http://www.andreasmagdanz.de/content/presse/txt/wams_080810.pdf" },
  { id: "media-p15", title: "Personenvereinzelungsanlage", mediaType: "press", source: "Berliner Zeitung", date: "22. Mai 2006", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=bz05-2006.txt" },
  { id: "media-p16", title: "Patient Wald fast tot - Forensik Fotografien gegen die Zerst\u00f6rung des Hambacher Forsts", mediaType: "press", source: "TAZ", date: "11. Mai 2016", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=taz_150511_gesellschaft-kultur.txt" },
  { id: "media-p17", title: "Abwaschbare architektonische Moderne", mediaType: "press", source: "taz", date: "26. M\u00e4rz 2013", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=taz_03-2013.txt" },
  { id: "media-p18", title: "Auschwitz-Birkenau", mediaType: "press", source: "Photonews", date: "01. April 2004", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=pn04-2004.txt" },
  { id: "media-p19", title: "Andreas Magdanz - Dienststelle Marienthal", mediaType: "press", source: "TAZ", date: "01. M\u00e4rz 2001", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=taz03-2001.txt" },
  { id: "media-p20", title: "Der Wahnwitz atomarer Kriegsspiele", mediaType: "press", source: "Telepolis", date: "30. M\u00e4rz 2001", externalUrl: "http://www.andreasmagdanz.de/index.php?id=6&linkurl=tp03-2001.txt" },
];

async function seedMediaItems(sanity: SanityClient): Promise<void> {
  log("MEDIA", `Seeding ${MEDIA_ITEMS.length} media items...`);

  for (const item of MEDIA_ITEMS) {
    const doc: Record<string, unknown> = {
      _id: item.id,
      _type: "mediaItem",
      title: item.title,
      mediaType: item.mediaType,
      source: item.source,
      date: parseGermanDate(item.date),
    };
    if (item.embedUrl) doc.embedUrl = item.embedUrl;
    if (item.externalUrl) doc.externalUrl = item.externalUrl;

    await sanity.createOrReplace(doc as any);
  }

  log("MEDIA", `Created ${MEDIA_ITEMS.length} media items.`);
}

// ---------------------------------------------------------------------------
// 4. EXHIBITIONS
// ---------------------------------------------------------------------------

interface ExhibitionData {
  id: string;
  title: string;
  type: "solo" | "group";
  venue: string;
  city: string;
  country: string;
  year: number;
  endYear?: number;
  relatedProjectId?: string;
}

const EXHIBITIONS: ExhibitionData[] = [
  // Key solo exhibitions
  { id: "exh-stammheim-stuttgart", title: "Stuttgart Stammheim", type: "solo", venue: "Kunstmuseum Stuttgart", city: "Stuttgart", country: "Germany", year: 2012, endYear: 2013, relatedProjectId: "project-stuttgart-stammheim" },
  { id: "exh-vogelsang-brussels", title: "Camp Vogelsang", type: "solo", venue: "Mus\u00e9e Royal de l'Arm\u00e9e", city: "Br\u00fcssel", country: "Belgium", year: 2010, relatedProjectId: "project-vogelsang" },
  { id: "exh-bnd-ludwig", title: "BND Standort Pullach", type: "solo", venue: "Ludwig Forum f\u00fcr Internationale Kunst", city: "Aachen", country: "Germany", year: 2008, relatedProjectId: "project-bnd-pullach" },
  { id: "exh-marienthal-einstein", title: "Dienststelle Marienthal", type: "solo", venue: "Einstein Forum", city: "Potsdam", country: "Germany", year: 2008, relatedProjectId: "project-dienststelle-marienthal" },
  { id: "exh-imaging-ludwig", title: "Imaging the Distance", type: "solo", venue: "Ludwig Forum f\u00fcr Internationale Kunst", city: "Aachen", country: "Germany", year: 2007 },
  { id: "exh-borden-ny-2007", title: "Dienststelle Marienthal / BND Pullach", type: "solo", venue: "Gallery Janet Borden, Inc.", city: "New York", country: "USA", year: 2007 },
  { id: "exh-arlington", title: "Imaging the Distance", type: "solo", venue: "Arlington Arts Center", city: "Arlington, Virginia", country: "USA", year: 2007 },
  { id: "exh-borden-ny-2004", title: "Auschwitz-Birkenau", type: "solo", venue: "Gallery Janet Borden, Inc.", city: "New York", country: "USA", year: 2004, relatedProjectId: "project-auschwitz-birkenau" },
  { id: "exh-paris-photo-2002", title: "Paris Photo", type: "solo", venue: "Gallery Janet Borden, Inc.", city: "Paris", country: "France", year: 2002 },
  { id: "exh-arles-2002", title: "Les Rencontres de la Photographie", type: "solo", venue: "Rencontres d'Arles", city: "Arles", country: "France", year: 2002 },
  { id: "exh-marienthal-bonn", title: "Dienststelle Marienthal", type: "solo", venue: "Rheinisches Landesmuseum", city: "Bonn", country: "Germany", year: 2001, relatedProjectId: "project-dienststelle-marienthal" },
  { id: "exh-paris-photo-2001", title: "Paris Photo", type: "solo", venue: "Carrousel du Louvre", city: "Paris", country: "France", year: 2001 },
  { id: "exh-suermondt-1994", title: "Ausstellung, Neubau", type: "solo", venue: "Suermondt Ludwig Museum", city: "Aachen", country: "Germany", year: 1994, relatedProjectId: "project-suermondt-ludwig-museum" },
  { id: "exh-suermondt-1992", title: "Ausstellung", type: "solo", venue: "Suermondt Ludwig Museum", city: "Aachen", country: "Germany", year: 1992 },
  { id: "exh-aachener-dom-1993", title: "Eifel Photographien", type: "solo", venue: "Kreuzgang des Aachener Doms", city: "Aachen", country: "Germany", year: 1993, relatedProjectId: "project-eifel" },
  { id: "exh-hambach-hildesheim", title: "Hambacher Forst, eine forensische Bestandsaufnahme", type: "solo", venue: "Rasselmaina", city: "Hildesheim", country: "Germany", year: 2016, relatedProjectId: "project-hambach-tagebau" },
  { id: "exh-hambach-aachen", title: "Hambacher Forst, eine forensische Bestandsaufnahme", type: "solo", venue: "Nadelfabrik", city: "Aachen", country: "Germany", year: 2016, relatedProjectId: "project-hambach-tagebau" },
  { id: "exh-kuenstlergespraech-kleve", title: "K\u00fcnstlergespr\u00e4ch", type: "solo", venue: "Museum Kurhaus Kleve", city: "Kleve", country: "Germany", year: 2013 },
  { id: "exh-kuenstlergespraech-duesseldorf", title: "K\u00fcnstlergespr\u00e4ch", type: "solo", venue: "Kunsthalle D\u00fcsseldorf", city: "D\u00fcsseldorf", country: "Germany", year: 2013 },
  // Key group exhibitions
  { id: "exh-sfmoma", title: "Gruppenausstellung", type: "group", venue: "San Francisco Museum of Modern Art", city: "San Francisco", country: "USA", year: 2010 },
  { id: "exh-tate", title: "Gruppenausstellung", type: "group", venue: "Tate Modern", city: "London", country: "United Kingdom", year: 2010 },
  { id: "exh-apex-ny", title: "Building the Unthinkable", type: "group", venue: "Apex Art Gallery", city: "New York", country: "USA", year: 2004 },
  { id: "exh-antwerp-photo", title: "Gruppenausstellung", type: "group", venue: "Museum of Photography Antwerp", city: "Antwerpen", country: "Belgium", year: 2006 },
  { id: "exh-kongress-bonn", title: "Kongress Erde", type: "group", venue: "Kunst- und Ausstellungshalle der Bundesrepublik", city: "Bonn", country: "Germany", year: 2001 },
  { id: "exh-biennale-liege", title: "Biennale", type: "group", venue: "Mus\u00e9e d'Art Moderne", city: "Li\u00e8ge", country: "Belgium", year: 1997 },
  { id: "exh-osthaus-hagen", title: "Gruppenausstellung", type: "group", venue: "Karl-Ernst-Osthaus Museum", city: "Hagen", country: "Germany", year: 1991 },
  { id: "exh-die-anderen-zehn", title: "Die Anderen Zehn", type: "group", venue: "Aachener Kunstverein", city: "Aachen", country: "Germany", year: 1990 },
];

async function seedExhibitions(sanity: SanityClient): Promise<void> {
  log("EXHIBITIONS", `Seeding ${EXHIBITIONS.length} exhibitions...`);

  for (const exh of EXHIBITIONS) {
    const doc: Record<string, unknown> = {
      _id: exh.id,
      _type: "exhibition",
      title: exh.title,
      type: exh.type,
      venue: exh.venue,
      city: exh.city,
      country: exh.country,
      year: exh.year,
    };
    if (exh.endYear) doc.endYear = exh.endYear;
    if (exh.relatedProjectId) {
      doc.relatedProject = {
        _type: "reference",
        _ref: exh.relatedProjectId,
      };
    }

    await sanity.createOrReplace(doc as any);
  }

  log("EXHIBITIONS", `Created ${EXHIBITIONS.length} exhibitions.`);
}

// ---------------------------------------------------------------------------
// 5. PUBLICATIONS
// ---------------------------------------------------------------------------

interface PublicationData {
  id: string;
  title: string;
  publisher: string;
  year: number;
  isbn?: string;
  purchaseUrl?: string;
}

const PUBLICATIONS: PublicationData[] = [
  {
    id: "pub-dienststelle-marienthal",
    title: "Dienststelle Marienthal \u2014 eine Geb\u00e4udemonographie",
    publisher: "Selbstverlag / MagBook",
    year: 2000,
    purchaseUrl: "http://www.dienststellemarienthal.de",
  },
  {
    id: "pub-auschwitz-birkenau",
    title: "Auschwitz-Birkenau \u2014 Hommage \u00e0 Marceline Loridan-Ivens",
    publisher: "Selbstverlag",
    year: 2003,
  },
  {
    id: "pub-bnd-pullach",
    title: "BND - Standort Pullach",
    publisher: "DuMont, K\u00f6ln",
    year: 2006,
    purchaseUrl: "http://www.bnd-standortpullach.de/",
  },
  {
    id: "pub-vogelsang",
    title: "NS-Ordensburg Vogelsang",
    publisher: "MagBook / Mus\u00e9e Royal de l'Arm\u00e9e",
    year: 2010,
    purchaseUrl: "http://www.magbooks.de/",
  },
  {
    id: "pub-stammheim",
    title: "STAMMHEIM \u2014 eine Geb\u00e4udemonographie",
    publisher: "Hartmann Books",
    year: 2012,
    purchaseUrl: "mailto:stammheimbuch@andreasmagdanz.de",
  },
  {
    id: "pub-eifel",
    title: "Eifel (Buch/Unikat)",
    publisher: "Selbstverlag",
    year: 1991,
  },
  {
    id: "pub-garzweiler-zeitung",
    title: "Garzweiler Zeitung",
    publisher: "Selbstverlag (Zeitungspapier)",
    year: 1997,
    purchaseUrl: "mailto:garzweilerzeitung@andreasmagdanz.de",
  },
  {
    id: "pub-hambacher-forst",
    title: "Immerath / Hambacher Forst",
    publisher: "book on demand, studentisches Projekt",
    year: 2014,
  },
  {
    id: "pub-lindt",
    title: "Lindt & Spr\u00fcngli Chocoladefabriken",
    publisher: "Buch/Print",
    year: 1992,
  },
  {
    id: "pub-photograph-katalog",
    title: "Andreas Magdanz \u2014 Photograph (Katalog)",
    publisher: "Selbstverlag",
    year: 1994,
  },
  {
    id: "pub-hans-und-grete",
    title: "Hans und Grete, Bilder der RAF, 1967-77",
    publisher: "MagBook",
    year: 2012,
  },
  {
    id: "pub-imaging-distance",
    title: "Imaging the Distance (Katalog)",
    publisher: "Arlington Arts Center / Ludwig Forum",
    year: 2007,
  },
  {
    id: "pub-regierungsbunker",
    title: "Der Regierungsbunker (Katalog)",
    publisher: "Bundesamt f\u00fcr Bauwesen und Raumordnung",
    year: 2007,
  },
];

async function seedPublications(sanity: SanityClient): Promise<void> {
  log("PUBLICATIONS", `Seeding ${PUBLICATIONS.length} publications...`);

  for (const pub of PUBLICATIONS) {
    const doc: Record<string, unknown> = {
      _id: pub.id,
      _type: "publication",
      title: pub.title,
      publisher: pub.publisher,
      year: pub.year,
    };
    if (pub.isbn) doc.isbn = pub.isbn;
    if (pub.purchaseUrl) doc.purchaseUrl = pub.purchaseUrl;

    await sanity.createOrReplace(doc as any);
  }

  log("PUBLICATIONS", `Created ${PUBLICATIONS.length} publications.`);
}

// ---------------------------------------------------------------------------
// 6. SITE SETTINGS
// ---------------------------------------------------------------------------

async function seedSiteSettings(sanity: SanityClient): Promise<void> {
  log("SETTINGS", "Creating site settings...");

  const doc: Record<string, unknown> = {
    _id: "siteSettings",
    _type: "siteSettings",
    siteTitle: "Andreas Magdanz",
    siteDescription:
      "Photography by Andreas Magdanz. Documentary and conceptual work exploring institutional memory, architecture, and historical sites.",
    contactEmail: "magdanz@andreasmagdanz.de",
    contactAddress: "Kapellenstra\u00dfe 66\nD-52066 Aachen\nGermany",
    galleryName: "Janet Borden Inc.",
    galleryUrl: "https://www.janetbordeninc.com",
    universityInfo:
      "HAWK Hildesheim/Holzminden/G\u00f6ttingen, Fakult\u00e4t Gestaltung",
    homeHeroProject: {
      _type: "reference",
      _ref: "project-dienststelle-marienthal",
    },
  };

  await sanity.createOrReplace(doc as any);
  log("SETTINGS", "Site settings created.");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Andreas Magdanz Portfolio \u2014 Sanity CMS Seed Script");
  console.log(`Project: ${SANITY_PROJECT_ID} | Dataset: ${SANITY_DATASET}`);
  console.log("=".repeat(60));
  console.log("");

  try {
    // Seed in dependency order: projects first (referenced by others)
    await seedProjects(client);
    console.log("");

    await seedCVEntries(client);
    console.log("");

    await seedExhibitions(client);
    console.log("");

    await seedPublications(client);
    console.log("");

    await seedMediaItems(client);
    console.log("");

    await seedSiteSettings(client);
    console.log("");

    console.log("=".repeat(60));
    console.log("SEED COMPLETE");
    console.log(`  Projects:     ${PROJECTS.length}`);
    console.log(`  CV Entries:   ${CV_ENTRIES.length}`);
    console.log(`  Exhibitions:  ${EXHIBITIONS.length}`);
    console.log(`  Publications: ${PUBLICATIONS.length}`);
    console.log(`  Media Items:  ${MEDIA_ITEMS.length}`);
    console.log(`  Site Settings: 1`);
    console.log(
      `  Images uploaded: ${imageCache.size}`,
    );
    console.log("=".repeat(60));
  } catch (err) {
    console.error("SEED FAILED:", err);
    process.exit(1);
  }
}

main();
