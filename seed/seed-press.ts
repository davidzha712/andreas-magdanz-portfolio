import { createClient } from "@sanity/client";
import fs from "fs";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) { console.error("ERROR: SANITY_API_WRITE_TOKEN required"); process.exit(1); }

const client = createClient({
  projectId: "b8e16q3y",
  dataset: "production",
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

interface Article {
  filename: string;
  title: string;
  source: string;
  date: string;
  fullText: string;
  error?: string;
}

let keyCounter = 0;
function key(): string {
  keyCounter++;
  return `press${keyCounter.toString(36).padStart(4, "0")}`;
}

function toPortableText(text: string) {
  if (!text?.trim()) return [];
  return text.split(/\n\n+/).filter(p => p.trim()).map(p => ({
    _type: "block",
    _key: key(),
    children: [{ _type: "span", _key: key(), marks: [], text: p.trim() }],
    markDefs: [],
    style: "normal",
  }));
}

async function main() {
  const articles: Article[] = JSON.parse(fs.readFileSync("/tmp/magdanz_press_articles_full.json", "utf8"));

  console.log(`Processing ${articles.length} press articles...`);

  // Get existing press media items from Sanity
  const existing = await client.fetch('*[_type == "mediaItem" && mediaType == "press"]{_id, title, externalUrl}');

  for (const article of articles) {
    if (article.error || !article.fullText) {
      console.log(`  SKIP: ${article.filename} (${article.error || 'no text'})`);
      continue;
    }

    // Match by filename in the externalUrl
    const match = existing.find((e: any) =>
      e.externalUrl?.includes(article.filename.replace('.txt', ''))
    );

    if (match) {
      // Update existing document with full text content
      const blocks = toPortableText(article.fullText);
      await client.patch(match._id).set({
        description: blocks,
        // Remove the external URL since content is now inline
        externalUrl: null,
      }).commit();
      console.log(`  UPDATED: ${match._id} — ${article.title}`);
    } else {
      console.log(`  NO MATCH: ${article.filename} — "${article.title}"`);
    }
  }

  console.log("Done!");
}

main().catch(err => { console.error(err); process.exit(1); });
