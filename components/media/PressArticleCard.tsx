import type { MediaItem } from "@/types/sanity";

interface PressArticleCardProps {
  mediaItem: MediaItem;
}

export default function PressArticleCard({ mediaItem }: PressArticleCardProps) {
  const formattedDate = mediaItem.date
    ? new Date(mediaItem.date).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article className="group border border-border bg-bg-muted/20 hover:bg-bg-muted/50 transition-all duration-200 p-5 hover:border-accent/30">
      {/* Source + date */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="font-sans text-xs uppercase tracking-widest text-accent">
          {mediaItem.source}
        </span>
        {formattedDate && (
          <time
            dateTime={mediaItem.date}
            className="font-sans text-xs text-fg-muted shrink-0"
          >
            {formattedDate}
          </time>
        )}
      </div>

      {/* Title */}
      <h3 className="font-serif text-lg text-fg leading-snug group-hover:text-accent transition-colors duration-200">
        {mediaItem.title}
      </h3>

      {/* External link */}
      {mediaItem.externalUrl && (
        <a
          href={mediaItem.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 font-sans text-xs uppercase tracking-wider text-fg-muted hover:text-fg transition-colors duration-200"
        >
          Read article
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
    </article>
  );
}
