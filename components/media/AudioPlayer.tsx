"use client";

import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  title: string;
  source: string;
  date?: string;
  url: string;
}

function resolveAudioUrl(url: string): string {
  const match = url.match(
    /andreasmagdanz\.de\/index\.php\?.*media=([^&]+\.mp3)/i
  );
  if (match) {
    return `http://www.andreasmagdanz.de/content/presse/media/${match[1]}`;
  }
  return url;
}

export default function AudioPlayer({
  title,
  source,
  date,
  url,
}: AudioPlayerProps) {
  const resolvedUrl = resolveAudioUrl(url);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("de-DE", {
        year: "numeric",
      })
    : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  };

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="group border border-border/60 bg-bg-muted/20 hover:bg-bg-muted/40 transition-colors duration-300 p-5 md:p-6">
      <audio ref={audioRef} src={resolvedUrl} preload="metadata" />

      <div className="flex items-start gap-4 md:gap-5">
        {/* Play / Pause button */}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="shrink-0 w-11 h-11 rounded-full border border-accent/70 flex items-center justify-center text-accent hover:bg-accent hover:text-bg transition-all duration-200 mt-0.5"
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-0.5"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Info + progress */}
        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-1">
            <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-accent">
              {source}
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
          <h3 className="font-serif text-base md:text-lg text-fg leading-snug mb-3">
            {title}
          </h3>

          {/* Progress bar */}
          <div
            className="relative h-1 bg-border/80 cursor-pointer group/bar rounded-full"
            onClick={handleSeek}
            role="slider"
            aria-label="Playback progress"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            onKeyDown={(e) => {
              const audio = audioRef.current;
              if (!audio) return;
              if (e.key === "ArrowRight")
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
              if (e.key === "ArrowLeft")
                audio.currentTime = Math.max(0, audio.currentTime - 5);
            }}
          >
            <div
              className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-accent opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150"
              style={{ left: `calc(${progress}% - 5px)` }}
            />
          </div>

          {/* Time */}
          <div className="flex justify-between mt-1.5 font-sans text-[11px] text-fg-muted tabular-nums">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
