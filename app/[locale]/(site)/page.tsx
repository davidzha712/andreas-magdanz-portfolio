import { getTranslations, setRequestLocale } from "next-intl/server";
import { client } from "@/lib/sanity/client";
import {
  siteSettingsQuery,
  featuredProjectsQuery,
} from "@/lib/sanity/queries";
import type { SiteSettings, Project } from "@/types/sanity";
import Hero3DWrapper from "@/components/hero3d/Hero3DWrapper";
import FeaturedWorksGrid from "@/components/home/FeaturedWorksGrid";
import { Link } from "@/i18n/navigation";

export const revalidate = 60;

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

  const heroProject = siteSettings?.homeHeroProject as Project | undefined;

  return (
    <>
      <Hero3DWrapper
        title="ANDREAS MAGDANZ"
        subtitle={
          heroProject
            ? `${heroProject.title}${heroProject.year ? ` — ${heroProject.year}` : ""}`
            : `${t("photographer")} — ${t("location")}`
        }
        scrollLabel={t("scroll")}
      />
      {featuredProjects.length > 0 && (
        <>
          <FeaturedWorksGrid projects={featuredProjects} title={t("selectedWorks")} />
          <div className="flex justify-center pb-16">
            <Link
              href="/work"
              className="font-sans text-sm tracking-widest uppercase text-fg-muted hover:text-accent transition-colors duration-300 flex items-center gap-2"
            >
              {t("allWorks")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </>
      )}
    </>
  );
}
