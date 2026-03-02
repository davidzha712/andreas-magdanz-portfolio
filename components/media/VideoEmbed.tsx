"use client";

interface VideoEmbedProps {
  title: string;
  embedUrl: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getOldSiteVideoUrl(url: string): string | null {
  // URL pattern: index.php?id=6002&media=FILENAME.mp4
  const match = url.match(/media=([^&]+\.mp4)/i);
  if (match) {
    return `http://www.andreasmagdanz.de/content/presse/media/${match[1]}`;
  }
  return null;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url) || /cdn\.sanity\.io\/files\//i.test(url);
}

export default function VideoEmbed({ title, embedUrl }: VideoEmbedProps) {
  const youtubeId = getYouTubeId(embedUrl);

  if (youtubeId) {
    return (
      <div className="space-y-2">
        <div className="relative w-full aspect-video bg-bg-muted overflow-hidden">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
        <p className="font-sans text-xs text-fg-muted">{title}</p>
      </div>
    );
  }

  // Direct video URL (Sanity CDN or other direct link)
  if (isDirectVideoUrl(embedUrl)) {
    return (
      <div className="space-y-2">
        <div className="relative w-full aspect-video bg-bg-muted overflow-hidden">
          <video
            controls
            preload="metadata"
            className="w-full h-full object-contain"
            title={title}
          >
            <source src={embedUrl} type="video/mp4" />
          </video>
        </div>
        <p className="font-sans text-xs text-fg-muted">{title}</p>
      </div>
    );
  }

  // Try old site MP4
  const mp4Url = getOldSiteVideoUrl(embedUrl);
  if (mp4Url) {
    return (
      <div className="space-y-2">
        <div className="relative w-full aspect-video bg-bg-muted overflow-hidden">
          <video
            controls
            preload="metadata"
            className="w-full h-full object-contain"
            title={title}
          >
            <source src={mp4Url} type="video/mp4" />
            <p className="font-sans text-sm text-fg-muted p-4">
              Video cannot be played.{" "}
              <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Open in new tab
              </a>
            </p>
          </video>
        </div>
        <p className="font-sans text-xs text-fg-muted">{title}</p>
      </div>
    );
  }

  // Fallback: direct link
  return (
    <div className="border border-border p-5 bg-bg-muted/20">
      <p className="font-serif text-base text-fg">{title}</p>
      <a
        href={embedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-sans text-xs text-accent hover:text-fg transition-colors mt-2 inline-block"
      >
        Watch Video
      </a>
    </div>
  );
}
