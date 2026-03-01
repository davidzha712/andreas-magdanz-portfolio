import type { Metadata } from "next";
import { client } from "@/lib/sanity/client";
import { allPublicationsQuery } from "@/lib/sanity/queries";
import type { Publication } from "@/types/sanity";
import PublicationGrid from "@/components/publications/PublicationGrid";

export const metadata: Metadata = {
  title: "Publications — Andreas Magdanz",
  description:
    "Books and publications by Andreas Magdanz — documentary photography monographs published with Steidl, Hatje Cantz, and Hartmann Books.",
};

const FALLBACK_PUBLICATIONS: Publication[] = [
  {
    _id: "pub-1",
    _type: "publication",
    title: "Eifel",
    publisher: "Edition Marzona",
    year: 1991,
  },
  {
    _id: "pub-2",
    _type: "publication",
    title: "Dienststelle Marienthal",
    publisher: "Steidl",
    year: 2002,
  },
  {
    _id: "pub-3",
    _type: "publication",
    title: "Auschwitz-Birkenau",
    publisher: "Hatje Cantz",
    year: 2007,
  },
  {
    _id: "pub-4",
    _type: "publication",
    title: "BND-Standort Pullach",
    publisher: "Hatje Cantz",
    year: 2009,
  },
  {
    _id: "pub-5",
    _type: "publication",
    title: "NS-Ordensburg Vogelsang",
    publisher: "Hatje Cantz",
    year: 2010,
  },
  {
    _id: "pub-6",
    _type: "publication",
    title: "Stuttgart Stammheim",
    publisher: "Hartmann Books",
    year: 2013,
  },
  {
    _id: "pub-7",
    _type: "publication",
    title: "Dienststelle Marienthal 2",
    publisher: "Hartmann Books",
    year: 2017,
  },
  {
    _id: "pub-8",
    _type: "publication",
    title: "Hambacher Forst",
    publisher: "Hartmann Books",
    year: 2019,
  },
];

export default async function PublicationsPage() {
  let publications: Publication[] = [];

  try {
    publications = await client.fetch<Publication[]>(allPublicationsQuery);
  } catch {
    // Sanity not connected — use fallback
  }

  const displayPublications =
    publications.length > 0 ? publications : FALLBACK_PUBLICATIONS;

  return (
    <div className="px-8 md:px-12 lg:px-16 py-16">
      {/* Page header */}
      <header className="mb-16">
        <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
          Publications
        </h1>
        <p className="mt-4 font-sans text-sm text-fg-muted tracking-wide max-w-md">
          Monographs and books documenting photographic projects, published with
          Steidl, Hatje Cantz, Hartmann Books, and others.
        </p>
        <div className="mt-6 w-12 h-px bg-accent" />
      </header>

      <PublicationGrid publications={displayPublications} />
    </div>
  );
}
