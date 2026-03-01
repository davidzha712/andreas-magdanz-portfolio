"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap/gsapPlugins";
import SanityImage from "@/components/shared/SanityImage";
import type { ProjectImage } from "@/types/sanity";

interface ImageSequenceProps {
  images: ProjectImage[];
  onImageClick: (index: number) => void;
}

export default function ImageSequence({
  images,
  onImageClick,
}: ImageSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const items = container.querySelectorAll(".image-item");

    items.forEach((item) => {
      gsap.fromTo(
        item,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item,
            start: "top 88%",
            once: true,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div ref={containerRef} className="space-y-6">
      {images.map((img, index) => (
        <figure key={img._key} className="image-item opacity-0">
          <button
            type="button"
            className="block w-full text-left group relative overflow-hidden"
            onClick={() => onImageClick(index)}
            aria-label={`Open image ${index + 1}: ${img.alt}`}
          >
            <div className="relative w-full">
              <SanityImage
                image={img.image}
                alt={img.alt}
                width={1200}
                height={800}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 65vw, 800px"
                className="w-full h-auto block transition-[filter] duration-500 ease-out group-hover:brightness-90"
              />
            </div>

            {/* Subtle zoom on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 ease-out" />
          </button>

          {img.caption && (
            <figcaption className="mt-2 font-sans text-xs text-fg-muted tracking-wide">
              {img.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
