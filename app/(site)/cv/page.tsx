import type { Metadata } from "next";
import { client } from "@/lib/sanity/client";
import { allCVEntriesQuery } from "@/lib/sanity/queries";
import type { CVEntry } from "@/types/sanity";
import CVTimeline from "@/components/cv/CVTimeline";
import CVDownloadButton from "@/components/cv/CVDownloadButton";

export const metadata: Metadata = {
  title: "Curriculum Vitae — Andreas Magdanz",
  description:
    "Curriculum vitae of Andreas Magdanz — exhibitions, awards, collections, teaching positions, and education.",
};

const FALLBACK_CV_ENTRIES: CVEntry[] = [
  // Education
  {
    _id: "edu-1",
    _type: "cvEntry",
    category: "education",
    year: 1984,
    endYear: 1990,
    title: "Photography",
    institution: "Folkwangschule Essen",
    location: "Essen, Germany",
  },
  {
    _id: "edu-2",
    _type: "cvEntry",
    category: "education",
    year: 1991,
    endYear: 1993,
    title: "Fine Arts / Photography",
    institution: "Hochschule für Bildende Künste Braunschweig",
    location: "Braunschweig, Germany",
  },
  // Teaching
  {
    _id: "teach-1",
    _type: "cvEntry",
    category: "teaching",
    year: 2000,
    endYear: 2005,
    title: "Visiting Lecturer, Photography",
    institution: "RWTH Aachen",
    location: "Aachen, Germany",
  },
  {
    _id: "teach-2",
    _type: "cvEntry",
    category: "teaching",
    year: 2005,
    title: "Professor of Photography",
    institution: "HAWK Hildesheim/Holzminden/Göttingen",
    location: "Hildesheim, Germany",
    description: "Faculty of Design — since 2005",
  },
  // Awards & Grants
  {
    _id: "award-1",
    _type: "cvEntry",
    category: "award",
    year: 2001,
    title: "Photography Prize",
    institution: "Deutsche Gesellschaft für Photographie (DGPh)",
    location: "Germany",
  },
  {
    _id: "award-2",
    _type: "cvEntry",
    category: "award",
    year: 2004,
    title: "Project Grant",
    institution: "Kunststiftung NRW (Art Foundation North Rhine-Westphalia)",
    location: "Germany",
  },
  {
    _id: "award-3",
    _type: "cvEntry",
    category: "award",
    year: 2008,
    title: "Project Grant",
    institution: "Kunststiftung NRW (Art Foundation North Rhine-Westphalia)",
    location: "Germany",
  },
  // Collections
  {
    _id: "coll-1",
    _type: "cvEntry",
    category: "collection",
    year: 2005,
    title: "San Francisco Museum of Modern Art",
    institution: "SFMOMA",
    location: "San Francisco, CA, USA",
  },
  {
    _id: "coll-2",
    _type: "cvEntry",
    category: "collection",
    year: 2003,
    title: "Kunstpalast Düsseldorf",
    institution: "Kunstpalast",
    location: "Düsseldorf, Germany",
  },
];

export default async function CVPage() {
  let entries: CVEntry[] = [];

  try {
    entries = await client.fetch<CVEntry[]>(allCVEntriesQuery);
  } catch {
    // Sanity not connected — use fallback
  }

  const displayEntries = entries.length > 0 ? entries : FALLBACK_CV_ENTRIES;

  return (
    <div className="px-8 md:px-12 lg:px-16 py-16 max-w-4xl mx-auto">
      {/* Page header */}
      <header className="mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
            Curriculum Vitae
          </h1>
          <div className="mt-4 w-12 h-px bg-accent" />
        </div>
        <CVDownloadButton />
      </header>

      {/* Timeline */}
      <CVTimeline entries={displayEntries} />

      {/* Footer spacer */}
      <div className="mt-24 pt-16 border-t border-border flex justify-end">
        <CVDownloadButton />
      </div>
    </div>
  );
}
