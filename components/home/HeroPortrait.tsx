"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap/gsapPlugins";
import SanityImage from "@/components/shared/SanityImage";
import type { SanityImageAsset } from "@/types/sanity";

interface HeroPortraitProps {
  image: SanityImageAsset;
  scrollLabel: string;
  photographerLabel: string;
  locationLabel?: string;
}

export default function HeroPortrait({
  image,
  scrollLabel,
  photographerLabel,
  locationLabel = "Aachen, Germany",
}: HeroPortraitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const portrait = portraitRef.current;
    const textEl = textRef.current;
    if (!container || !portrait || !textEl) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set(container, { opacity: 1 });
      gsap.set(portrait, { scale: 1, opacity: 1 });
      gsap.set(textEl, { opacity: 1 });
      return;
    }

    const tl = gsap.timeline();

    tl.fromTo(
      container,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power2.out" }
    )
      .fromTo(
        portrait,
        { scale: 1.1, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.4, ease: "power3.out" },
        "-=0.3"
      )
      .fromTo(
        textEl,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.6"
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Blurred background fill — same image, zoomed + blurred */}
      <div ref={containerRef} className="absolute inset-0 opacity-0">
        <div className="absolute inset-0 scale-125">
          <SanityImage
            image={image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover blur-2xl brightness-[0.35]"
            priority
          />
        </div>
      </div>

      {/* Dark overlay for depth */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Centered portrait */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={portraitRef}
          className="relative w-[45vh] max-w-[360px] aspect-[3/4] opacity-0"
        >
          <SanityImage
            image={image}
            alt="Andreas Magdanz"
            fill
            sizes="(max-width: 768px) 60vw, 360px"
            className="object-cover"
            priority
          />
          {/* Subtle border */}
          <div className="absolute inset-0 ring-1 ring-white/10" />
        </div>
      </div>

      {/* Gradient fade at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg via-bg/60 to-transparent" />

      {/* Text overlay — bottom left */}
      <div
        ref={textRef}
        className="absolute bottom-16 left-8 md:left-12 lg:left-16 opacity-0 z-10"
      >
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight text-white leading-none">
          ANDREAS MAGDANZ
        </h1>
        <p className="mt-3 font-sans text-sm tracking-widest uppercase text-white/60">
          {photographerLabel} — {locationLabel}
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 z-10">
        <span className="font-sans text-[10px] tracking-widest uppercase">
          {scrollLabel}
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
  );
}
