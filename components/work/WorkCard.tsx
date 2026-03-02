"use client";

import { Link } from "@/i18n/navigation";
import SanityImage from "@/components/shared/SanityImage";
import type { Project } from "@/types/sanity";

interface WorkCardProps {
  project: Project;
}

export default function WorkCard({ project }: WorkCardProps) {
  return (
    <Link
      href={`/work/${project.slug.current}`}
      className="work-card group block"
    >
      {/* Image container */}
      <div className="relative overflow-hidden aspect-[3/4]">
        {project.coverImage ? (
          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
            <SanityImage
              image={project.coverImage.image}
              alt={project.coverImage.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-[filter] duration-500 ease-out group-hover:brightness-[0.85]"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-bg-muted" />
        )}

        {/* Hover title overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out">
          <p className="font-serif text-lg text-white leading-tight">
            {project.title}
          </p>
          {project.year && (
            <p className="font-sans text-xs tracking-widest uppercase text-white/65 mt-1">
              {project.year}
            </p>
          )}
        </div>
      </div>

      {/* Below-image metadata */}
      <div className="mt-3">
        <p className="font-serif text-lg text-fg leading-snug group-hover:text-accent transition-colors duration-300">
          {project.title}
        </p>
        {project.year && (
          <p className="font-sans text-sm text-fg-muted mt-0.5">{project.year}</p>
        )}
      </div>
    </Link>
  );
}
