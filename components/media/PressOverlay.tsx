"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import type { MediaItem } from "@/types/sanity";
import PortableText from "@/components/shared/PortableText";

interface PressOverlayProps {
  item: MediaItem;
  onClose: () => void;
  translations: {
    viewPdf: string;
    openArticle: string;
    pdfAvailable: string;
    externalArticle: string;
  };
}

export default function PressOverlay({
  item,
  onClose,
  translations: t,
}: PressOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    contentRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const formattedDate = item.date
    ? new Date(item.date + "T00:00:00").toLocaleDateString(
        locale === "de" ? "de-DE" : "en-US",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : null;

  const hasContent = item.description && item.description.length > 0;
  const isPdf = item.externalUrl?.endsWith(".pdf");

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm press-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-6 right-6 md:top-8 md:right-8 z-50 w-10 h-10 flex items-center justify-center text-fg-muted hover:text-fg transition-colors duration-200"
        aria-label="Close"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Scrollable content */}
      <div
        ref={contentRef}
        tabIndex={-1}
        className="h-full overflow-y-auto overscroll-contain outline-none"
      >
        <article className="max-w-2xl mx-auto px-6 md:px-8 py-16 md:py-24 press-overlay-content">
          {/* Source & date */}
          <div className="mb-8">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-accent">
              {item.source}
            </p>
            {formattedDate && (
              <p className="font-sans text-xs text-fg-muted mt-1.5">
                {formattedDate}
              </p>
            )}
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] text-fg leading-[1.15] tracking-tight">
            {item.title}
          </h1>

          {/* Divider */}
          <div className="mt-8 mb-10 w-16 h-px bg-accent" />

          {/* Body */}
          {hasContent ? (
            <div className="article-body">
              <PortableText value={item.description!} />
            </div>
          ) : item.externalUrl ? (
            <div className="py-8">
              <p className="font-sans text-sm text-fg-muted mb-6 leading-relaxed">
                {isPdf ? t.pdfAvailable : t.externalArticle}
              </p>
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 font-sans text-sm tracking-wide text-fg border border-border px-5 py-2.5 hover:border-accent hover:text-accent transition-colors duration-200"
              >
                {isPdf ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    {t.viewPdf}
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {t.openArticle}
                  </>
                )}
              </a>
            </div>
          ) : null}

          <div className="h-16" />
        </article>
      </div>
    </div>,
    document.body
  );
}
