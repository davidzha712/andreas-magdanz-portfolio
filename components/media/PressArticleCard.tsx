"use client";

import { useState } from "react";
import type { MediaItem } from "@/types/sanity";

interface PressArticleCardProps {
  mediaItem: MediaItem;
}

export default function PressArticleCard({ mediaItem }: PressArticleCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasInlineContent = mediaItem.description && mediaItem.description.length > 0;

  // Extract plain text from Portable Text blocks
  const articleText = hasInlineContent
    ? (mediaItem.description as any[]).map(block => {
        if (block._type !== "block") return "";
        return (block.children as { text: string }[])?.map(c => c.text).join("") || "";
      }).filter(Boolean)
    : [];

  return (
    <div className="border border-border bg-bg-muted/20 overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-xs uppercase tracking-widest text-accent mb-1">
            {mediaItem.source}
            {mediaItem.date && (
              <span className="text-fg-muted/60 ml-2 normal-case tracking-normal">
                {mediaItem.date}
              </span>
            )}
          </p>
          <h3 className="font-serif text-base text-fg leading-snug">
            {mediaItem.title}
          </h3>
        </div>

        {hasInlineContent ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 font-sans text-xs uppercase tracking-wider text-fg-muted hover:text-fg transition-colors duration-200 border border-border px-3 py-1.5"
          >
            {expanded ? "Close" : "Read"}
          </button>
        ) : mediaItem.externalUrl ? (
          <a
            href={mediaItem.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-sans text-xs uppercase tracking-wider text-fg-muted hover:text-fg transition-colors duration-200 border border-border px-3 py-1.5"
          >
            Link
          </a>
        ) : null}
      </div>

      {/* Expandable article content */}
      {hasInlineContent && expanded && (
        <div className="border-t border-border px-5 py-6 max-h-[60vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            {articleText.map((paragraph, i) => (
              <p key={i} className="font-sans text-sm text-fg/90 leading-relaxed mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
