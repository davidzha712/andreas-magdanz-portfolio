"use client";

import { useState } from "react";
import Image from "next/image";

interface VideoEmbedProps {
  title: string;
  source: string;
  date?: string;
  embedUrl: string;
  locale?: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function isDirectVideoUrl(url: string): boolean {
  return (
    /\.(mp4|webm|ogg)(\?|$)/i.test(url) ||
    /cdn\.sanity\.io\/files\//i.test(url)
  );
}

function getOldSiteVideoUrl(url: string): string | null {
  const match = url.match(/media=([^&]+\.mp4)/i);
  if (match) {
    return `http://www.andreasmagdanz.de/content/presse/media/${match[1]}`;
  }
  return null;
}

function getVideoMime(url: string): string {
  if (/\.webm/i.test(url)) return "video/webm";
  if (/\.ogg/i.test(url)) return "video/ogg";
  return "video/mp4";
}

export default function VideoEmbed({
  title,
  source,
  date,
  embedUrl,
  locale = "de",
}: VideoEmbedProps) {
  const [isActive, setIsActive] = useState(false);
  const youtubeId = getYouTubeId(embedUrl);

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString(locale === "en" ? "en-US" : "de-DE", {
        year: "numeric",
      })
    : null;

  // Resolve the actual video URL
  let videoUrl = embedUrl;
  const directUrl = isDirectVideoUrl(embedUrl)
    ? embedUrl
    : getOldSiteVideoUrl(embedUrl);

  if (directUrl) videoUrl = directUrl;

  // YouTube: show thumbnail first, click to play
  if (youtubeId) {
    return (
      <div className="group">
        <div className="relative w-full aspect-video bg-bg-muted overflow-hidden">
          {!isActive ? (
            <button
              onClick={() => setIsActive(true)}
              className="relative w-full h-full"
              aria-label={`Play: ${title}`}
            >
              {/* YouTube thumbnail */}
              <Image
                src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                alt=""
                fill
                className="object-cover brightness-75 group-hover:brightness-[0.6] transition-all duration-500 group-hover:scale-[1.02]"
              />
              {/* Play icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/80 flex items-center justify-center backdrop-blur-sm bg-black/20 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="white"
                    className="ml-1"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
            </button>
          ) : (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&cc_load_policy=1&cc_lang_pref=${locale}`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          )}
        </div>
        <VideoMeta title={title} source={source} date={formattedDate} />
      </div>
    );
  }

  // Direct video URL or Sanity CDN
  if (directUrl) {
    return (
      <div className="group">
        <div className="relative w-full aspect-video bg-bg-muted overflow-hidden">
          {!isActive ? (
            <button
              onClick={() => setIsActive(true)}
              className="relative w-full h-full bg-bg-muted"
              aria-label={`Play: ${title}`}
            >
              {/* Video poster frame - preload metadata for poster */}
              <video
                preload="metadata"
                muted
                playsInline
                className="w-full h-full object-contain brightness-75 group-hover:brightness-[0.6] transition-all duration-500"
              >
                <source src={`${videoUrl}#t=0.5`} type={getVideoMime(videoUrl)} />
              </video>
              {/* Play icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/80 flex items-center justify-center backdrop-blur-sm bg-black/20 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="white"
                    className="ml-1"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
            </button>
          ) : (
            <video
              controls
              autoPlay
              preload="auto"
              className="w-full h-full object-contain"
              title={title}
            >
              <source src={videoUrl} type={getVideoMime(videoUrl)} />
            </video>
          )}
        </div>
        <VideoMeta title={title} source={source} date={formattedDate} />
      </div>
    );
  }

  // Fallback: external link card
  return (
    <div className="group">
      <a
        href={embedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full aspect-video bg-bg-muted overflow-hidden"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-fg-muted/40 flex items-center justify-center group-hover:border-accent transition-colors duration-300">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-fg-muted group-hover:text-accent transition-colors duration-300"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
        </div>
      </a>
      <VideoMeta title={title} source={source} date={formattedDate} />
    </div>
  );
}

function VideoMeta({
  title,
  source,
  date,
}: {
  title: string;
  source: string;
  date: string | null;
}) {
  return (
    <div className="mt-4 md:mt-5">
      <div className="flex items-center gap-3 mb-1.5">
        <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-accent">
          {source}
        </span>
        {date && (
          <>
            <span className="w-px h-3 bg-border" />
            <span className="font-sans text-[11px] text-fg-muted tracking-wide">
              {date}
            </span>
          </>
        )}
      </div>
      <h3 className="font-serif text-lg md:text-xl text-fg leading-snug">
        {title}
      </h3>
    </div>
  );
}
