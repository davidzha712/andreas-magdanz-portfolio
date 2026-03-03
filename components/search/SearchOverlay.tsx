"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { client } from "@/lib/sanity/client";
import { searchAllContentQuery } from "@/lib/sanity/queries";
import type {
  SearchData,
  SearchProject,
  SearchExhibition,
  SearchPublication,
  SearchCVEntry,
  SearchMediaItem,
} from "@/types/sanity";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult =
  | { type: "project"; item: SearchProject }
  | { type: "exhibition"; item: SearchExhibition }
  | { type: "publication"; item: SearchPublication }
  | { type: "cvEntry"; item: SearchCVEntry }
  | { type: "mediaItem"; item: SearchMediaItem };

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-accent/20 text-fg rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function getSearchableText(result: SearchResult): string[] {
  switch (result.type) {
    case "project":
      return [result.item.title, result.item.location ?? "", result.item.year];
    case "exhibition":
      return [
        result.item.title,
        result.item.venue,
        result.item.city,
        result.item.country,
        String(result.item.year),
      ];
    case "publication":
      return [
        result.item.title,
        result.item.publisher,
        String(result.item.year),
      ];
    case "cvEntry":
      return [
        result.item.title,
        result.item.institution ?? "",
        result.item.location ?? "",
        String(result.item.year),
      ];
    case "mediaItem":
      return [result.item.title, result.item.source];
  }
}

const MAX_PER_GROUP = 5;

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<SearchData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch data on first open
  useEffect(() => {
    if (!isOpen) return;
    if (cacheRef.current) {
      setData(cacheRef.current);
      return;
    }
    setLoading(true);
    client
      .fetch(searchAllContentQuery, { locale })
      .then((result) => {
        cacheRef.current = result as SearchData;
        setData(result as SearchData);
      })
      .finally(() => setLoading(false));
  }, [isOpen, locale]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const filterResults = useCallback((): Map<string, SearchResult[]> => {
    if (!data) return new Map();

    const q = query.toLowerCase().trim();
    const grouped = new Map<string, SearchResult[]>();

    const allResults: SearchResult[] = [
      ...data.projects.map(
        (item) => ({ type: "project", item }) as SearchResult
      ),
      ...data.exhibitions.map(
        (item) => ({ type: "exhibition", item }) as SearchResult
      ),
      ...data.publications.map(
        (item) => ({ type: "publication", item }) as SearchResult
      ),
      ...data.cvEntries.map(
        (item) => ({ type: "cvEntry", item }) as SearchResult
      ),
      ...data.mediaItems.map(
        (item) => ({ type: "mediaItem", item }) as SearchResult
      ),
    ];

    const filtered = q
      ? allResults.filter((r) =>
          getSearchableText(r).some((text) => text.toLowerCase().includes(q))
        )
      : allResults;

    for (const result of filtered) {
      const group = grouped.get(result.type) ?? [];
      if (group.length < MAX_PER_GROUP) {
        group.push(result);
        grouped.set(result.type, group);
      }
    }

    return grouped;
  }, [data, query]);

  const groupedResults = filterResults();
  const hasResults = groupedResults.size > 0;

  const sectionLabels: Record<string, string> = {
    project: t("work"),
    exhibition: t("exhibitions"),
    publication: t("publications"),
    cvEntry: t("cv"),
    mediaItem: t("media"),
  };

  function getHref(result: SearchResult): string {
    switch (result.type) {
      case "project":
        return `/work/${result.item.slug}`;
      case "exhibition":
        return "/exhibitions";
      case "publication":
        return "/publications";
      case "cvEntry":
        return "/cv";
      case "mediaItem":
        return "/media";
    }
  }

  function renderMeta(result: SearchResult): string {
    switch (result.type) {
      case "project":
        return [result.item.year, result.item.location]
          .filter(Boolean)
          .join(" · ");
      case "exhibition":
        return [
          result.item.type === "solo" ? "Solo" : "Group",
          result.item.venue,
          `${result.item.city}, ${result.item.country}`,
          String(result.item.year),
        ].join(" · ");
      case "publication":
        return [result.item.publisher, String(result.item.year)].join(" · ");
      case "cvEntry":
        return [result.item.institution, result.item.location, String(result.item.year)]
          .filter(Boolean)
          .join(" · ");
      case "mediaItem":
        return [result.item.source, result.item.date].filter(Boolean).join(" · ");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="mx-auto mt-[10vh] max-w-2xl bg-bg border border-border rounded-sm shadow-lg max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-fg-muted shrink-0"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("placeholder")}
                className="flex-1 font-serif text-2xl bg-transparent outline-none text-fg placeholder:text-fg-muted/50"
              />
              <button
                onClick={onClose}
                className="font-sans text-xs text-fg-muted hover:text-fg transition-colors uppercase tracking-widest"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading && (
                <p className="font-sans text-sm text-fg-muted text-center py-8">
                  Loading…
                </p>
              )}

              {!loading && data && !hasResults && query.trim() && (
                <p className="font-sans text-sm text-fg-muted text-center py-8">
                  {t("noResults")}
                </p>
              )}

              {!loading &&
                data &&
                ["project", "exhibition", "publication", "cvEntry", "mediaItem"].map(
                  (type) => {
                    const results = groupedResults.get(type);
                    if (!results?.length) return null;

                    return (
                      <div key={type} className="mb-6 last:mb-0">
                        <h3 className="font-sans text-xs uppercase tracking-widest text-fg-muted mb-3">
                          {sectionLabels[type]}
                        </h3>
                        <ul className="space-y-1">
                          {results.map((result) => (
                            <li key={result.item._id}>
                              <Link
                                href={getHref(result)}
                                onClick={onClose}
                                className="block px-3 py-2 -mx-3 rounded-sm hover:bg-bg-muted transition-colors duration-150 group"
                              >
                                <span className="font-serif text-lg text-fg group-hover:text-accent transition-colors duration-150">
                                  {highlightMatch(result.item.title, query)}
                                </span>
                                <span className="block font-sans text-xs text-fg-muted mt-0.5">
                                  {renderMeta(result)}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
