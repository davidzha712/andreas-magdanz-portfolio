import { getTranslations, setRequestLocale } from "next-intl/server";
import { client } from "@/lib/sanity/client";
import { allProjectsQuery } from "@/lib/sanity/queries";
import type { Project } from "@/types/sanity";
import WorkGrid from "@/components/work/WorkGrid";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "work" });
  return {
    title: `${t("title")} — Andreas Magdanz`,
    description: t("description"),
  };
}

// Placeholder projects shown when Sanity is not connected
const PLACEHOLDER_PROJECTS = [
  { id: "1", title: "Eifel", year: "1995-1998", slug: "eifel" },
  { id: "2", title: "Garzweiler", year: "2003-2006", slug: "garzweiler" },
  { id: "3", title: "Dienststelle Marienthal", year: "1999-2000", slug: "dienststelle-marienthal" },
  { id: "4", title: "Auschwitz-Birkenau", year: "2002-2003", slug: "auschwitz-birkenau" },
  { id: "5", title: "BND-Standort Pullach", year: "2005-2006", slug: "bnd-standort-pullach" },
  { id: "6", title: "Stuttgart Stammheim", year: "2010-2012", slug: "stuttgart-stammheim" },
  { id: "7", title: "Bitterfeld", year: "1996-1997", slug: "bitterfeld" },
  { id: "8", title: "Kraftwerk", year: "2001-2002", slug: "kraftwerk" },
  { id: "9", title: "Transitraume", year: "2007-2009", slug: "transitraeume" },
  { id: "10", title: "Archive", year: "2013-2015", slug: "archive" },
];

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("work");

  let projects: Project[] = [];

  try {
    projects = await client.fetch<Project[]>(allProjectsQuery);
  } catch {
    // Sanity not connected — use fallback
  }

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

      {/* Grid — CMS or placeholder */}
      {projects.length > 0 ? (
        <WorkGrid projects={projects} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLACEHOLDER_PROJECTS.map((p) => (
            <Link key={p.id} href={`/work/${p.slug}`} className="group block">
              {/* Placeholder image */}
              <div className="relative overflow-hidden aspect-[3/4] bg-bg-muted">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-fg-muted/30 text-base text-center px-4 leading-tight">
                    {p.title}
                  </span>
                </div>
              </div>

              {/* Text */}
              <div className="mt-3">
                <p className="font-serif text-lg text-fg group-hover:text-accent transition-colors duration-300">
                  {p.title}
                </p>
                <p className="font-sans text-sm text-fg-muted mt-0.5">{p.year}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
