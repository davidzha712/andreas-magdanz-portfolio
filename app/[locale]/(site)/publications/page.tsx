import { getTranslations, setRequestLocale } from "next-intl/server";
import { client } from "@/lib/sanity/client";
import { allPublicationsQuery } from "@/lib/sanity/queries";
import type { Publication } from "@/types/sanity";
import PublicationGrid from "@/components/publications/PublicationGrid";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "publications" });
  return {
    title: `${t("title")} — Andreas Magdanz`,
    description: t("description"),
  };
}

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

export default async function PublicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("publications");

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
          {t("title")}
        </h1>
        <p className="mt-4 font-sans text-sm text-fg-muted tracking-wide max-w-md">
          {t("description")}
        </p>
        <div className="mt-6 w-12 h-px bg-accent" />
      </header>

      <PublicationGrid publications={displayPublications} />
    </div>
  );
}
