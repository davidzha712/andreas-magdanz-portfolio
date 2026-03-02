import { getTranslations, setRequestLocale } from "next-intl/server";
import { client } from "@/lib/sanity/client";
import { allMediaItemsQuery } from "@/lib/sanity/queries";
import type { MediaItem } from "@/types/sanity";
import AudioPlayer from "@/components/media/AudioPlayer";
import VideoEmbed from "@/components/media/VideoEmbed";
import PressArticleCard from "@/components/media/PressArticleCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "media" });
  return {
    title: `${t("title")} — Andreas Magdanz`,
    description: t("description"),
  };
}

export default async function MediaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("media");

  let mediaItems: MediaItem[] = [];
  try {
    mediaItems = await client.fetch<MediaItem[]>(allMediaItemsQuery, { locale });
  } catch {
    /* Sanity not connected */
  }

  const audioItems = mediaItems.filter((m) => m.mediaType === "audio");
  const videoItems = mediaItems.filter((m) => m.mediaType === "video");
  const pressItems = mediaItems.filter((m) => m.mediaType === "press");

  return (
    <div className="px-6 md:px-12 lg:px-16 py-16 md:py-24">
      {/* Page header */}
      <header className="max-w-4xl mx-auto mb-20 md:mb-28">
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-fg tracking-tight leading-none">
          {t("title")}
        </h1>
        <p className="mt-5 font-sans text-sm text-fg-muted tracking-wide max-w-lg leading-relaxed">
          {t("description")}
        </p>
        <div className="mt-8 w-16 h-px bg-accent" />
      </header>

      <div className="space-y-28 md:space-y-36">
        {/* ── Video Section ── */}
        {videoItems.length > 0 && (
          <section className="max-w-5xl mx-auto">
            <SectionHeader title={t("video")} />
            <div className="space-y-16 md:space-y-20">
              {videoItems.map((item) =>
                item.embedUrl ? (
                  <VideoEmbed
                    key={item._id}
                    title={item.title}
                    source={item.source}
                    date={item.date}
                    embedUrl={item.embedUrl}
                    locale={locale}
                  />
                ) : null
              )}
            </div>
          </section>
        )}

        {/* ── Audio Section ── */}
        {audioItems.length > 0 && (
          <section className="max-w-3xl mx-auto">
            <SectionHeader title={t("audio")} />
            <div className="space-y-3">
              {audioItems.map((item) =>
                item.embedUrl ? (
                  <AudioPlayer
                    key={item._id}
                    title={item.title}
                    source={item.source}
                    date={item.date}
                    url={item.embedUrl}
                    locale={locale}
                  />
                ) : (
                  <div
                    key={item._id}
                    className="py-4 border-b border-border/50 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-accent mb-1">
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
                        className="shrink-0 font-sans text-[11px] uppercase tracking-[0.15em] text-fg-muted hover:text-accent transition-colors duration-200"
                      >
                        {t("listen")}
                        <span className="ml-1">&#8599;</span>
                      </a>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* ── Press Section ── */}
        {pressItems.length > 0 && (
          <section className="max-w-3xl mx-auto">
            <SectionHeader title={t("press")} />
            <div>
              {pressItems.map((item) => (
                <PressArticleCard
                  key={item._id}
                  mediaItem={item}
                  locale={locale}
                  translations={{
                    read: t("read"),
                    viewPdf: t("viewPdf"),
                    openArticle: t("openArticle"),
                    pdfAvailable: t("pdfAvailable"),
                    externalArticle: t("externalArticle"),
                    loading: t("loading"),
                    error: t("error"),
                    pageOf: t("pageOf"),
                    pageTotal: t("pageTotal"),
                    downloadPdf: t("downloadPdf"),
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {mediaItems.length === 0 && (
          <p className="font-sans text-sm text-fg-muted text-center py-16">
            {t("noResults")}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-10 md:mb-14 flex items-center gap-6">
      <h2 className="font-serif text-3xl md:text-4xl text-fg">{title}</h2>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}
