import { getTranslations, setRequestLocale } from "next-intl/server";
import { client } from "@/lib/sanity/client";
import {
  siteSettingsQuery,
  featuredProjectsQuery,
} from "@/lib/sanity/queries";
import type { SiteSettings, Project } from "@/types/sanity";
import HeroSection from "@/components/home/HeroSection";
import HeroPortrait from "@/components/home/HeroPortrait";
import FeaturedWorksGrid from "@/components/home/FeaturedWorksGrid";
import { Link } from "@/i18n/navigation";

// Placeholder projects shown when Sanity is not connected
const PLACEHOLDER_PROJECTS = [
  { id: "1", title: "Dienststelle Marienthal", year: "1999-2000", slug: "dienststelle-marienthal" },
  { id: "2", title: "Auschwitz-Birkenau", year: "2002-2003", slug: "auschwitz-birkenau" },
  { id: "3", title: "BND-Standort Pullach", year: "2005-2006", slug: "bnd-standort-pullach" },
  { id: "4", title: "Stuttgart Stammheim", year: "2010-2012", slug: "stuttgart-stammheim" },
  { id: "5", title: "Garzweiler", year: "2003-2006", slug: "garzweiler" },
  { id: "6", title: "Eifel", year: "1995-1998", slug: "eifel" },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: `Andreas Magdanz — ${t("photographer")}`,
    description:
      "Photography by Andreas Magdanz. Documentary and conceptual work exploring institutional memory, landscape, and architecture.",
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  let siteSettings: SiteSettings | null = null;
  let featuredProjects: Project[] = [];

  try {
    [siteSettings, featuredProjects] = await Promise.all([
      client.fetch<SiteSettings>(siteSettingsQuery, { locale }),
      client.fetch<Project[]>(featuredProjectsQuery),
    ]);
  } catch {
    // Sanity not connected — use fallback UI
  }

  // CMS-connected path — project hero
  if (siteSettings?.homeHeroProject && featuredProjects.length > 0) {
    return (
      <>
        <HeroSection project={siteSettings.homeHeroProject as Project} scrollLabel={t("scroll")} />
        <FeaturedWorksGrid projects={featuredProjects} title={t("selectedWorks")} />
      </>
    );
  }

  // Portrait hero or gradient fallback
  return (
    <>
      {siteSettings?.heroImage ? (
        <HeroPortrait
          image={siteSettings.heroImage}
          scrollLabel={t("scroll")}
          photographerLabel={t("photographer")}
          locationLabel={t("location")}
        />
      ) : (
        <section className="relative h-screen overflow-hidden flex items-end">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 40%, #111111 70%, #0a0a0a 100%)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
          <div className="relative z-10 px-8 md:px-12 lg:px-16 pb-16">
            <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl tracking-tight text-fg leading-none">
              ANDREAS MAGDANZ
            </h1>
            <p className="mt-3 font-sans text-sm tracking-widest uppercase text-fg-muted">
              {t("photographer")} — {t("location")}
            </p>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-fg-muted/60">
            <span className="font-sans text-[10px] tracking-widest uppercase">
              {t("scroll")}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="animate-bounce"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </section>
      )}

      {/* Featured works from CMS or placeholders */}
      {featuredProjects.length > 0 ? (
        <FeaturedWorksGrid projects={featuredProjects} title={t("selectedWorks")} />
      ) : (
        <section className="py-24 px-8 md:px-12 lg:px-16">
          <h2 className="font-serif text-4xl text-center text-fg mb-16 tracking-tight">
            {t("selectedWorks")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLACEHOLDER_PROJECTS.map((p) => (
              <Link
                key={p.id}
                href={`/work/${p.slug}`}
                className="group block"
              >
                <div className="relative overflow-hidden aspect-[3/4] bg-bg-muted">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.8) 100%)",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-serif text-fg-muted/30 text-lg text-center px-4 leading-tight">
                      {p.title}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="font-serif text-lg text-fg group-hover:text-accent transition-colors duration-300">
                    {p.title}
                  </p>
                  <p className="font-sans text-sm text-fg-muted mt-0.5">
                    {p.year}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
