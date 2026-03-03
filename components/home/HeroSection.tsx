"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap/gsapPlugins";
import SanityImage from "@/components/shared/SanityImage";
import type { Project } from "@/types/sanity";

interface HeroSectionProps {
  project: Project;
  scrollLabel?: string;
  heroImage?: import("@/types/sanity").SanityImageAsset;
  heroVideoUrl?: string;
  heroVideoPosition?: string;
}

export default function HeroSection({ project, scrollLabel = "Scroll", heroImage, heroVideoUrl, heroVideoPosition = "center" }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set(container, { clipPath: "inset(0%)" });
      gsap.set(textEl, { opacity: 1 });
      return;
    }

    const tl = gsap.timeline();

    tl.fromTo(
      container,
      { clipPath: "inset(15%)" },
      {
        clipPath: "inset(0%)",
        duration: 1.5,
        ease: "power3.inOut",
      }
    ).fromTo(
      textEl,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.8"
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Full-bleed background media */}
      <div ref={containerRef} className="absolute inset-0">
        {heroVideoUrl ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: heroVideoPosition }}
            poster=""
          >
            <source src={heroVideoUrl} type={heroVideoUrl.endsWith(".webm") ? "video/webm" : "video/mp4"} />
          </video>
        ) : (
          <SanityImage
            image={heroImage ?? project.coverImage.image}
            alt={heroImage ? "Andreas Magdanz" : project.coverImage.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Gradient overlay — transparent top, dark bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />

      {/* Text overlay — bottom left */}
      <div
        ref={textRef}
        className="absolute bottom-16 left-8 md:left-12 lg:left-16 opacity-0"
      >
        <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl tracking-tight text-fg leading-none">
          ANDREAS MAGDANZ
        </h1>
        <p className="mt-3 font-sans text-sm tracking-widest uppercase text-fg-muted">
          {project.title}
          {project.year && (
            <span className="ml-3 text-fg-muted/60">{project.year}</span>
          )}
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-fg-muted/60">
        <span className="font-sans text-[10px] tracking-widest uppercase">
          {scrollLabel}
        </span>
        <ScrollChevron />
      </div>
    </section>
  );
}

function ScrollChevron() {
  return (
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
  );
}
