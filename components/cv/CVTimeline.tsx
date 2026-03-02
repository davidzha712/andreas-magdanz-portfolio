"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap, ScrollTrigger } from "@/lib/gsap/gsapPlugins";
import type { CVEntry } from "@/types/sanity";

interface CVTimelineProps {
  entries: CVEntry[];
}

const CATEGORY_ORDER: CVEntry["category"][] = [
  "education",
  "teaching",
  "soloExhibition",
  "groupExhibition",
  "award",
  "grant",
  "collection",
  "publication",
];

export default function CVTimeline({ entries }: CVTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("cv");

  const CATEGORY_LABELS: Record<CVEntry["category"], string> = {
    soloExhibition: t("soloExhibition"),
    groupExhibition: t("groupExhibition"),
    award: t("award"),
    collection: t("collection"),
    teaching: t("teaching"),
    education: t("education"),
    publication: t("publication"),
    grant: t("grant"),
  };

  // Group entries by category
  const grouped = CATEGORY_ORDER.reduce<
    Record<string, CVEntry[]>
  >((acc, cat) => {
    const items = entries.filter((e) => e.category === cat);
    if (items.length > 0) {
      acc[cat] = items.sort((a, b) => b.year - a.year);
    }
    return acc;
  }, {});

  // Fallback: include any categories not in CATEGORY_ORDER
  entries.forEach((e) => {
    if (!CATEGORY_ORDER.includes(e.category) && !grouped[e.category]) {
      grouped[e.category] = entries
        .filter((x) => x.category === e.category)
        .sort((a, b) => b.year - a.year);
    }
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    // Animate entries with stagger per section
    const entryElements = container.querySelectorAll<HTMLElement>(".cv-entry");
    entryElements.forEach((entry) => {
      gsap.fromTo(
        entry,
        { opacity: 0, x: -24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: entry,
            start: "top 90%",
            once: true,
          },
        }
      );
    });

    // Animate section headings
    const headings = container.querySelectorAll<HTMLElement>(".cv-heading");
    headings.forEach((heading) => {
      gsap.fromTo(
        heading,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: heading,
            start: "top 90%",
            once: true,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [entries]);

  const categoryKeys = Object.keys(grouped) as CVEntry["category"][];

  return (
    <div ref={containerRef} className="space-y-16">
      {categoryKeys.map((cat) => (
        <section key={cat}>
          {/* Section heading with accent underline */}
          <div className="cv-heading opacity-0 mb-8">
            <h2 className="font-serif text-2xl text-fg">
              {CATEGORY_LABELS[cat] ?? cat}
            </h2>
            <div className="mt-2 w-10 h-px bg-accent" />
          </div>

          {/* Timeline line + entries */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[80px] top-0 bottom-0 w-px bg-border hidden sm:block" />

            <div className="space-y-6">
              {grouped[cat].map((entry) => (
                <div
                  key={entry._id}
                  className="cv-entry opacity-0 sm:grid sm:grid-cols-[80px_1fr] sm:gap-8 group"
                >
                  {/* Year column */}
                  <div className="hidden sm:flex items-start justify-end pr-6 pt-0.5">
                    <span className="font-sans text-sm font-medium text-fg-muted tabular-nums">
                      {entry.endYear
                        ? `${entry.year}\u2013${entry.endYear}`
                        : entry.year}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative pl-0 sm:pl-6">
                    {/* Timeline dot */}
                    <div className="hidden sm:block absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-accent bg-bg group-hover:bg-accent transition-colors duration-200" />

                    {/* Mobile year */}
                    <span className="sm:hidden font-sans text-xs font-medium text-fg-muted tracking-wider uppercase block mb-1">
                      {entry.endYear
                        ? `${entry.year}\u2013${entry.endYear}`
                        : entry.year}
                    </span>

                    <p className="font-serif text-base text-fg leading-snug">
                      {entry.title}
                    </p>

                    {(entry.institution || entry.location) && (
                      <p className="font-sans text-sm text-fg-muted mt-0.5">
                        {[entry.institution, entry.location]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}

                    {entry.description && (
                      <p className="font-sans text-xs text-fg-muted mt-1 leading-relaxed">
                        {entry.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
