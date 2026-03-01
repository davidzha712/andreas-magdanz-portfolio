import type { Metadata } from "next";
import { client } from "@/lib/sanity/client";
import { allMediaItemsQuery } from "@/lib/sanity/queries";
import type { MediaItem } from "@/types/sanity";
import AudioPlayer from "@/components/media/AudioPlayer";
import VideoEmbed from "@/components/media/VideoEmbed";
import PressArticleCard from "@/components/media/PressArticleCard";

export const metadata: Metadata = {
  title: "Media — Andreas Magdanz",
  description:
    "Audio interviews, video features, and press coverage of Andreas Magdanz's photographic work.",
};

const FALLBACK_MEDIA_ITEMS: MediaItem[] = [
  // Audio
  {
    _id: "media-audio-1",
    _type: "mediaItem",
    title: "Scala — Interview über Dienststelle Marienthal",
    mediaType: "audio",
    source: "WDR 5",
    date: "2002-03-15",
    externalUrl: "https://www.wdr.de",
  },
  {
    _id: "media-audio-2",
    _type: "mediaItem",
    title: "Mosaik — Über das Projekt Stuttgart Stammheim",
    mediaType: "audio",
    source: "WDR 3",
    date: "2013-09-10",
    externalUrl: "https://www.wdr.de",
  },
  // Video
  {
    _id: "media-video-1",
    _type: "mediaItem",
    title: "Andreas Magdanz — Photographer",
    mediaType: "video",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    source: "YouTube",
    date: "2020-01-01",
  },
  // Press
  {
    _id: "media-press-1",
    _type: "mediaItem",
    title:
      "Architektur des Grauens — Magdanz dokumentiert Stätten der NS-Geschichte",
    mediaType: "press",
    source: "Süddeutsche Zeitung",
    date: "2010-07-22",
    externalUrl: "https://www.sueddeutsche.de",
  },
  {
    _id: "media-press-2",
    _type: "mediaItem",
    title: "Die Orte des BND — Fotografien von Andreas Magdanz",
    mediaType: "press",
    source: "Frankfurter Allgemeine Zeitung",
    date: "2009-11-05",
    externalUrl: "https://www.faz.net",
  },
  {
    _id: "media-press-3",
    _type: "mediaItem",
    title: "Stammheim revisited — Magdanz im Museum für Photographie",
    mediaType: "press",
    source: "art-magazin.de",
    date: "2013-10-14",
    externalUrl: "https://www.art-magazin.de",
  },
];

export default async function MediaPage() {
  let mediaItems: MediaItem[] = [];

  try {
    mediaItems = await client.fetch<MediaItem[]>(allMediaItemsQuery);
  } catch {
    // Sanity not connected — use fallback
  }

  const displayItems = mediaItems.length > 0 ? mediaItems : FALLBACK_MEDIA_ITEMS;

  const audioItems = displayItems.filter((m) => m.mediaType === "audio");
  const videoItems = displayItems.filter((m) => m.mediaType === "video");
  const pressItems = displayItems.filter((m) => m.mediaType === "press");

  return (
    <div className="px-8 md:px-12 lg:px-16 py-16 max-w-5xl mx-auto">
      {/* Page header */}
      <header className="mb-16">
        <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
          Media
        </h1>
        <p className="mt-4 font-sans text-sm text-fg-muted tracking-wide max-w-md">
          Audio interviews, video features, and press coverage.
        </p>
        <div className="mt-6 w-12 h-px bg-accent" />
      </header>

      <div className="space-y-20">
        {/* Audio section */}
        {audioItems.length > 0 && (
          <section>
            <SectionHeading title="Audio" />
            <div className="space-y-4">
              {audioItems.map((item) =>
                item.embedUrl ? (
                  <AudioPlayer
                    key={item._id}
                    title={item.title}
                    source={item.source}
                    url={item.embedUrl}
                  />
                ) : (
                  /* No direct audio URL — render as press-style card with link */
                  <div
                    key={item._id}
                    className="border border-border bg-bg-muted/20 p-5 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="font-sans text-xs uppercase tracking-widest text-accent mb-1">
                        {item.source}
                      </p>
                      <h3 className="font-serif text-base text-fg">
                        {item.title}
                      </h3>
                    </div>
                    {item.externalUrl && (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 font-sans text-xs uppercase tracking-wider text-fg-muted hover:text-fg transition-colors duration-200 border border-border px-3 py-1.5"
                      >
                        Listen
                      </a>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* Video section */}
        {videoItems.length > 0 && (
          <section>
            <SectionHeading title="Video" />
            <div className="grid sm:grid-cols-2 gap-6">
              {videoItems.map((item) =>
                item.embedUrl ? (
                  <VideoEmbed
                    key={item._id}
                    title={item.title}
                    embedUrl={item.embedUrl}
                  />
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Press section */}
        {pressItems.length > 0 && (
          <section>
            <SectionHeading title="Press" />
            <div className="grid sm:grid-cols-2 gap-4">
              {pressItems.map((item) => (
                <PressArticleCard key={item._id} mediaItem={item} />
              ))}
            </div>
          </section>
        )}

        {displayItems.length === 0 && (
          <p className="font-sans text-sm text-fg-muted text-center py-16">
            No media items found.
          </p>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-2xl text-fg">{title}</h2>
      <div className="mt-2 w-8 h-px bg-accent" />
    </div>
  );
}
