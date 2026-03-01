"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap/gsapPlugins";
import type { Publication } from "@/types/sanity";
import PublicationCard from "./PublicationCard";

interface PublicationGridProps {
  publications: Publication[];
}

export default function PublicationGrid({ publications }: PublicationGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const cards = grid.querySelectorAll<HTMLElement>(".pub-card");
    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          delay: (i % 4) * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 92%",
            once: true,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [publications]);

  if (!publications || publications.length === 0) {
    return (
      <p className="font-sans text-sm text-fg-muted text-center py-16">
        No publications found.
      </p>
    );
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      {publications.map((publication) => (
        <div key={publication._id} className="pub-card opacity-0">
          <PublicationCard publication={publication} />
        </div>
      ))}
    </div>
  );
}
