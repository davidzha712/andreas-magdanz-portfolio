import type { Metadata } from "next";
import { client } from "@/lib/sanity/client";
import {
  siteSettingsQuery,
  featuredProjectsQuery,
} from "@/lib/sanity/queries";
import type { SiteSettings, Project } from "@/types/sanity";
import HeroSection from "@/components/home/HeroSection";
import FeaturedWorksGrid from "@/components/home/FeaturedWorksGrid";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Andreas Magdanz — Photographer",
  description:
    "Photography by Andreas Magdanz. Documentary and conceptual work exploring institutional memory, landscape, and architecture.",
};

// Placeholder projects shown when Sanity is not connected
const PLACEHOLDER_PROJECTS = [
  { id: "1", title: "Dienststelle Marienthal", year: "1999–2000", slug: "dienststelle-marienthal" },
  { id: "2", title: "Auschwitz-Birkenau", year: "2002–2003", slug: "auschwitz-birkenau" },
  { id: "3", title: "BND-Standort Pullach", year: "2005–2006", slug: "bnd-standort-pullach" },
  { id: "4", title: "Stuttgart Stammheim", year: "2010–2012", slug: "stuttgart-stammheim" },
  { id: "5", title: "Garzweiler", year: "2003–2006", slug: "garzweiler" },
  { id: "6", title: "Eifel", year: "1995–1998", slug: "eifel" },
];

export default async function HomePage() {
  let siteSettings: SiteSettings | null = null;
  let featuredProjects: Project[] = [];

  try {
    [siteSettings, featuredProjects] = await Promise.all([
      client.fetch<SiteSettings>(siteSettingsQuery),
      client.fetch<Project[]>(featuredProjectsQuery),
    ]);
  } catch {
    // Sanity not connected — use fallback UI
  }

  // CMS-connected path
  if (siteSettings?.homeHeroProject && featuredProjects.length > 0) {
    return (
      <>
        <HeroSection project={siteSettings.homeHeroProject as Project} />
        <FeaturedWorksGrid projects={featuredProjects} />
      </>
    );
  }

  // Fallback UI
  return (
    <>
      {/* Hero — full-screen dark placeholder */}
      <section className="relative h-screen overflow-hidden flex items-end">
        {/* Gradient background as placeholder */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 40%, #111111 70%, #0a0a0a 100%)",
          }}
          aria-hidden="true"
        />
        {/* Subtle noise-like texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)",
          }}
          aria-hidden="true"
        />

        {/* Gradient fade at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />

        {/* Text */}
        <div className="relative z-10 px-8 md:px-12 lg:px-16 pb-16">
          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl tracking-tight text-fg leading-none">
            ANDREAS MAGDANZ
          </h1>
          <p className="mt-3 font-sans text-sm tracking-widest uppercase text-fg-muted">
            Photographer — Aachen, Germany
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-fg-muted/60">
          <span className="font-sans text-[10px] tracking-widest uppercase">
            Scroll
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

      {/* Featured works — placeholder cards */}
      <section className="py-24 px-8 md:px-12 lg:px-16">
        <h2 className="font-serif text-4xl text-center text-fg mb-16 tracking-tight">
          Selected Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLACEHOLDER_PROJECTS.map((p) => (
            <Link
              key={p.id}
              href={`/work/${p.slug}`}
              className="group block"
            >
              {/* Placeholder image area */}
              <div className="relative overflow-hidden aspect-[3/4] bg-bg-muted">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.8) 100%)",
                  }}
                />
                {/* Corner detail */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-fg-muted/30 text-lg text-center px-4 leading-tight">
                    {p.title}
                  </span>
                </div>
              </div>

              {/* Text */}
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
    </>
  );
}
