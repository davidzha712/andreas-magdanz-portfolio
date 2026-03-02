"use client";

import { useRef, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap/gsapPlugins";
import SanityImage from "@/components/shared/SanityImage";
import type { Project } from "@/types/sanity";

interface FeaturedWorksGridProps {
  projects: Project[];
  title: string;
}

export default function FeaturedWorksGrid({ projects, title }: FeaturedWorksGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const cards = grid.querySelectorAll(".work-card");

    gsap.fromTo(
      cards,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: grid,
          start: "top 80%",
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section className="py-24 px-8 md:px-12 lg:px-16">
      <h2 className="font-serif text-4xl text-center text-fg mb-16 tracking-tight">
        {title}
      </h2>

      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {projects.map((project) => (
          <FeaturedCard key={project._id} project={project} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/work/${project.slug.current}`}
      className="work-card group block relative overflow-hidden aspect-[3/4] opacity-0"
    >
      {/* Image */}
      <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
        {project.coverImage ? (
          <SanityImage
            image={project.coverImage.image}
            alt={project.coverImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-[filter] duration-500 ease-out group-hover:brightness-[0.85]"
          />
        ) : (
          <div className="w-full h-full bg-bg-muted" />
        )}
      </div>

      {/* Hover overlay with title */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out">
        <p className="font-serif text-xl text-white leading-tight">
          {project.title}
        </p>
        {project.year && (
          <p className="font-sans text-xs tracking-widest uppercase text-white/70 mt-1">
            {project.year}
          </p>
        )}
      </div>
    </Link>
  );
}
