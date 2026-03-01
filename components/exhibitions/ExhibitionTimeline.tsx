"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap/gsapPlugins";
import type { Exhibition } from "@/types/sanity";

interface ExhibitionTimelineProps {
  exhibitions: Exhibition[];
}

type FilterType = "all" | "solo" | "group";

export default function ExhibitionTimeline({
  exhibitions,
}: ExhibitionTimelineProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = exhibitions.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    // Kill existing triggers before re-animating
    ScrollTrigger.getAll().forEach((t) => t.kill());

    const cards =
      container.querySelectorAll<HTMLElement>(".exhibition-card");
    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          delay: (i % 3) * 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            once: true,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [filtered]);

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Solo", value: "solo" },
    { label: "Group", value: "group" },
  ];

  return (
    <div>
      {/* Filter controls */}
      <div className="flex items-center gap-2 mb-12 flex-wrap">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={[
              "px-5 py-1.5 font-sans text-xs uppercase tracking-widest border transition-all duration-200",
              filter === btn.value
                ? "bg-accent text-bg border-accent"
                : "bg-transparent text-fg-muted border-border hover:border-fg-muted hover:text-fg",
            ].join(" ")}
          >
            {btn.label}
            {btn.value !== "all" && (
              <span className="ml-1.5 opacity-60">
                ({exhibitions.filter((e) => e.type === btn.value).length})
              </span>
            )}
          </button>
        ))}
        <span className="font-sans text-xs text-fg-muted ml-2">
          {filtered.length} exhibition{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      <div ref={containerRef} className="relative">
        {/* Center line — visible on desktop */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

        <div className="space-y-8 lg:space-y-0">
          {filtered.map((exhibition, index) => {
            const isLeft = index % 2 === 0;

            return (
              <div
                key={exhibition._id}
                className={[
                  "exhibition-card opacity-0",
                  "lg:grid lg:grid-cols-2 lg:gap-8",
                  "lg:mb-10",
                ].join(" ")}
              >
                {/* Left side content (even indices) */}
                <div
                  className={[
                    "lg:flex",
                    isLeft ? "lg:justify-end lg:pr-8" : "lg:col-start-2 lg:pl-8",
                  ].join(" ")}
                  style={
                    !isLeft
                      ? { gridColumn: "2", gridRow: "1" }
                      : {}
                  }
                >
                  <ExhibitionCard exhibition={exhibition} align={isLeft ? "right" : "left"} />
                </div>

                {/* Spacer for alternating side on desktop */}
                {isLeft && <div className="hidden lg:block" />}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="font-sans text-sm text-fg-muted text-center py-16">
            No exhibitions found.
          </p>
        )}
      </div>
    </div>
  );
}

function ExhibitionCard({
  exhibition,
  align,
}: {
  exhibition: Exhibition;
  align: "left" | "right";
}) {
  return (
    <div
      className={[
        "group relative border border-border bg-bg-muted/30 hover:bg-bg-muted/60",
        "transition-all duration-300 p-6 max-w-sm w-full",
        "hover:border-accent/40",
      ].join(" ")}
    >
      {/* Year badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-sans text-xs text-fg-muted tabular-nums tracking-wider">
          {exhibition.year}
        </span>
        <span
          className={[
            "font-sans text-xs uppercase tracking-widest px-2 py-0.5 border",
            exhibition.type === "solo"
              ? "border-accent/50 text-accent"
              : "border-border text-fg-muted",
          ].join(" ")}
        >
          {exhibition.type}
        </span>
      </div>

      {/* Accent dot / venue image placeholder */}
      <div className="mb-4">
        <div className="w-full aspect-[16/7] bg-bg-muted flex items-center justify-center overflow-hidden">
          <div className="w-3 h-3 rounded-full bg-accent/60 group-hover:bg-accent transition-colors duration-300" />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-serif text-xl text-fg leading-snug group-hover:text-accent transition-colors duration-200">
        {exhibition.title}
      </h3>

      {/* Venue + city */}
      <p className="font-sans text-sm text-fg-muted mt-1.5">
        {[exhibition.venue, exhibition.city, exhibition.country]
          .filter(Boolean)
          .join(", ")}
      </p>
    </div>
  );
}
