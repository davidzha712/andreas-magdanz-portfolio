import { getTranslations, setRequestLocale } from "next-intl/server";
import { client } from "@/lib/sanity/client";
import { allExhibitionsQuery } from "@/lib/sanity/queries";
import type { Exhibition } from "@/types/sanity";
import ExhibitionTimeline from "@/components/exhibitions/ExhibitionTimeline";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "exhibitions" });
  return {
    title: `${t("title")} — Andreas Magdanz`,
    description: t("description"),
  };
}

const FALLBACK_EXHIBITIONS: Exhibition[] = [
  // Solo exhibitions
  {
    _id: "ex-solo-1",
    _type: "exhibition",
    title: "Dienststelle Marienthal",
    type: "solo",
    venue: "Sprengel Museum Hannover",
    city: "Hannover",
    country: "Germany",
    year: 2001,
  },
  {
    _id: "ex-solo-2",
    _type: "exhibition",
    title: "Auschwitz",
    type: "solo",
    venue: "C/O Berlin",
    city: "Berlin",
    country: "Germany",
    year: 2007,
  },
  {
    _id: "ex-solo-3",
    _type: "exhibition",
    title: "BND — Standort Pullach",
    type: "solo",
    venue: "Deutsches Historisches Museum Berlin",
    city: "Berlin",
    country: "Germany",
    year: 2009,
  },
  {
    _id: "ex-solo-4",
    _type: "exhibition",
    title: "NS-Ordensburg Vogelsang",
    type: "solo",
    venue: "NS-Dokumentationszentrum Koln",
    city: "Cologne",
    country: "Germany",
    year: 2010,
  },
  {
    _id: "ex-solo-5",
    _type: "exhibition",
    title: "Stuttgart Stammheim",
    type: "solo",
    venue: "Museum fur Photographie Braunschweig",
    city: "Braunschweig",
    country: "Germany",
    year: 2013,
  },
  // Group exhibitions
  {
    _id: "ex-group-1",
    _type: "exhibition",
    title: "Architektur und Verbrechen",
    type: "group",
    venue: "Kunsthalle Dusseldorf",
    city: "Dusseldorf",
    country: "Germany",
    year: 2003,
  },
  {
    _id: "ex-group-2",
    _type: "exhibition",
    title: "Permanent Collection",
    type: "group",
    venue: "San Francisco Museum of Modern Art",
    city: "San Francisco",
    country: "USA",
    year: 2005,
  },
  {
    _id: "ex-group-3",
    _type: "exhibition",
    title: "Rencontres d'Arles",
    type: "group",
    venue: "Rencontres d'Arles",
    city: "Arles",
    country: "France",
    year: 2008,
  },
];

export default async function ExhibitionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("exhibitions");

  let exhibitions: Exhibition[] = [];

  try {
    exhibitions = await client.fetch<Exhibition[]>(allExhibitionsQuery);
  } catch {
    // Sanity not connected — use fallback
  }

  const displayExhibitions =
    exhibitions.length > 0 ? exhibitions : FALLBACK_EXHIBITIONS;

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

      {/* Timeline */}
      <ExhibitionTimeline exhibitions={displayExhibitions} />
    </div>
  );
}
