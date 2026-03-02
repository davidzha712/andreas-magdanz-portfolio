"use client";

import { useState } from "react";
import type { MediaItem } from "@/types/sanity";
import PressOverlay from "./PressOverlay";

interface PressArticleCardProps {
  mediaItem: MediaItem;
  translations: {
    read: string;
    viewPdf: string;
    openArticle: string;
    pdfAvailable: string;
    externalArticle: string;
  };
}

export default function PressArticleCard({
  mediaItem,
  translations,
}: PressArticleCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);

  const hasContent = mediaItem.description && mediaItem.description.length > 0;
  const isPdf =
    mediaItem.externalUrl?.endsWith(".pdf") && !hasContent;
  const canOpen = hasContent || mediaItem.externalUrl;

  const formattedDate = mediaItem.date
    ? new Date(mediaItem.date + "T00:00:00").toLocaleDateString("de-DE", {
        year: "numeric",
      })
    : null;

  return (
    <>
      <button
        onClick={() => canOpen && setShowOverlay(true)}
        disabled={!canOpen}
        className="group w-full text-left py-6 border-b border-border/50 first:border-t first:border-border/50 transition-colors duration-300 hover:bg-bg-muted/30 disabled:cursor-default"
      >
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Source & year */}
            <div className="flex items-center gap-3 mb-2">
              <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-accent">
                {mediaItem.source}
              </span>
              {formattedDate && (
                <>
                  <span className="w-px h-3 bg-border" />
                  <span className="font-sans text-[11px] text-fg-muted tracking-wide">
                    {formattedDate}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h3 className="font-serif text-lg md:text-xl text-fg leading-snug group-hover:text-accent transition-colors duration-300">
              {mediaItem.title}
            </h3>
          </div>

          {/* Action indicator */}
          {canOpen && (
            <span className="shrink-0 font-sans text-[11px] uppercase tracking-[0.15em] text-fg-muted group-hover:text-accent transition-colors duration-300 flex items-center gap-1.5">
              {isPdf ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="opacity-60"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  PDF
                </>
              ) : (
                <>
                  {translations.read}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="transform group-hover:translate-x-0.5 transition-transform duration-300 opacity-60"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </span>
          )}
        </div>
      </button>

      {showOverlay && (
        <PressOverlay
          item={mediaItem}
          onClose={() => setShowOverlay(false)}
          translations={translations}
        />
      )}
    </>
  );
}
