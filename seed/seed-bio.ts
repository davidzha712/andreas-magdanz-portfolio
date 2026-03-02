import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("ERROR: SANITY_API_WRITE_TOKEN required");
  process.exit(1);
}

const client = createClient({
  projectId: "b8e16q3y",
  dataset: "production",
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

let keyCounter = 0;
function key(): string {
  keyCounter += 1;
  return `bio${keyCounter.toString(36).padStart(4, "0")}`;
}

function block(text: string, style: string = "normal") {
  return {
    _type: "block",
    _key: key(),
    children: [{ _type: "span", _key: key(), marks: [], text }],
    markDefs: [],
    style,
  };
}

async function main() {
  console.log("Updating siteSettings with biography content...");

  await client.patch("siteSettings").set({
    artistBio: [
      block("Fotografie als Kunst, das Motiv überleben zu lassen", "h2"),
      block("Fotokunst dagegen verfolgt Ideen, vermittelt Inhalte, verdichtet Erkenntnisse jenseits des Handwerklichen. Die Arbeit des gebürtigen Mönchengladbachers Andreas Magdanz ist Fotografie: Überzeugend, von sensibler Dominanz, überraschend, bewegend, trotzdem schlicht, fast einfach, ruhig. Sie wirkt wie Widerstand gegen die Bilderflut. Sie vermittelt komplexe Betrachtungsweisen, bewusste Inhalte, dokumentiert nicht zeitgeistgerecht oder medienverwertbar. Sie führt fort vom geschichtlichen Beleg einer Tat oder Person. Sie ist nicht mehr nur appellierendes Ablichten, sondern drückt Befindlichkeit, Anspruch und Einflussnahme aus. Andreas Magdanz versucht, sein Erleben der Umwelt dem Betrachter vorzustellen, ihn zu sensibilisieren für das Motiv, dessen eigenen bildnerischen Hintergrund, ebenso wie für die Entscheidung des Fotografen."),
      block("Schranken der Politik", "h3"),
      block("Schon während der Studienzeit galt Magdanz' Interesse umweltpolitischen, ökologischen Fragen. Er arbeitete für die Ökologisch-Demokratische Partei und vertrat deren Ideen bei Wahlen zum Landtag und für das Europa-Parlament. Jedoch geriet der heute 29jährige in der Politik an Schranken, die allein mit Überzeugung nicht aufgehoben werden konnten. Es folgte die Rückbesinnung auf die Fotografie, mit Aufnahmen, die vor allem zeigen, was er vor Landschaften empfindet: meditative Ruhe, Gleichgewicht."),
      block("Fotografien geht Erlebnis voraus. Auf Reisen in die USA, nach Russland, Schottland oder Irland entstanden wichtige Bilder. Genauso findet Magdanz seine Motive aber auch beim Hinsehen in der nahen Umgebung. Wochenlang radelte er durch die Eifel, fand Menschen und Gegenstände, die zur Aufnahme reizen, etwa wenn Landschaften sich dem Blick öffnen, sich ein besonderes Licht bietet. Landschaft ist ein bedeutender Motivgeber des Mönchengladbachers, mal als komplexer Lebensraum, mal in Strukturen und Mikrokosmen, wie sie sich nur im Ausschnitt von Bäumen, Blättern, Bodenflächen finden. Magdanz hält ohne Pathos eine Schönheit fest, wie sie sich offenen Auges finden lässt."),
      block("Dabei ist seine Fotografie emotional, doch niemals rührselig oder verletzend. Leidenschaft gilt es ihm zu bewahren, nicht, sie voyeuristisch aufzuarbeiten."),
      block("Ohne Effekthascherei", "h3"),
      block("Ihm geht es um Glaubwürdigkeit und Authentizität — eben um Nichtkünstlichkeit. Andreas Magdanz ist ein Fotograf des Greifbaren und des Sinnlichen. Mit seinen leisen, oftmals intim wirkenden Aufnahmen nähert er sich der Bildidee, die ihm vorschwebt. Dabei lässt er vieles gelten, verändert wenig, belässt dem Licht als Seele der Fotografie seine eigene Kraft, reduziert es nicht auf die Funktion, unverzichtbare technische Voraussetzung zu sein. Er gibt dem vorhandenen Licht neben dem Motiv Autorität, Bedeutung. Mit wenig Aufhell-Effekten und fast ohne Blitz geht es dabei auch um Wahrhaftigkeit: Nicht die Absprache, das Posieren und Manipulieren steht im Vordergrund. Deshalb ist Andreas Magdanz einer der wenigen Fotografen, die auf Neuigkeits- und Effekthascherei verzichten, die vielmehr versuchen, dem Betrachter Platz für Phantasie und Erinnerung zu lassen."),
      block("— Stefan Skowron, Rheinische Post, 2. Januar 1993"),
    ],
    teachingHistory: [
      block("Lehre", "h2"),
      block("Prof. Andreas Magdanz", "h3"),
      block("HAWK — Hochschule für angewandte Wissenschaft und Kunst Hildesheim/Holzminden/Göttingen, Fakultät Gestaltung (seit 2005)"),
      block("RWTH — Rheinisch-Westfälische Technische Hochschule, Fakultät Architektur, bildnerische Gestaltung"),
      block("Fotografieren kann jeder. Es lässt sich schliesslich erlernen. Fotokunst dagegen verfolgt Ideen, vermittelt Inhalte, verdichtet Erkenntnisse jenseits des Handwerklichen."),
      block("Der Fotokünstler Andreas Magdanz entwickelt seine fotografischen Werkkomplexe aus der Wechselwirkung zwischen dem Medium Fotografie und den mit Spannung aufgeladenen besonderen Orten als Motiv."),
    ],
    galleryAddress: "Janet Borden Inc.\n560 Broadway, Suite 601\nNew York, NY 10012\nUnited States",
    universityAddress: "HAWK Hildesheim/Holzminden/Göttingen\nFakultät Gestaltung\nLübecker Straße 2\n31134 Hildesheim, Germany",
    contactPhone: "+49 (0) 241 / 99 72 111",
  }).commit();

  console.log("Done! siteSettings updated with biography content.");
}

main().catch((err) => { console.error(err); process.exit(1); });
