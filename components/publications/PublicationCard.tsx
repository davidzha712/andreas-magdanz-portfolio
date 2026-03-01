import SanityImage from "@/components/shared/SanityImage";
import type { Publication } from "@/types/sanity";

interface PublicationCardProps {
  publication: Publication;
}

export default function PublicationCard({ publication }: PublicationCardProps) {
  return (
    <div className="group relative flex flex-col">
      {/* Book cover */}
      <div className="relative overflow-hidden aspect-[2/3] bg-bg-muted transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-black/20">
        {publication.coverImage ? (
          <SanityImage
            image={publication.coverImage}
            alt={`${publication.title} cover`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          /* Placeholder book cover */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-bg-muted border border-border/50">
            {/* Decorative spine line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <p className="font-serif text-sm text-fg-muted/60 text-center leading-snug">
              {publication.title}
            </p>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors duration-300" />
      </div>

      {/* Text */}
      <div className="mt-3 flex-1">
        <h3 className="font-serif text-base text-fg leading-snug group-hover:text-accent transition-colors duration-200 line-clamp-2">
          {publication.title}
        </h3>
        <p className="font-sans text-xs text-fg-muted mt-1">
          {publication.publisher}
          {publication.year ? `, ${publication.year}` : ""}
        </p>

        {publication.purchaseUrl && (
          <a
            href={publication.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 font-sans text-xs uppercase tracking-wider text-accent hover:text-fg transition-colors duration-200"
          >
            Buy
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
