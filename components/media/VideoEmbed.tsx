interface VideoEmbedProps {
  title: string;
  embedUrl: string;
}

export default function VideoEmbed({ title, embedUrl }: VideoEmbedProps) {
  return (
    <div className="border border-border overflow-hidden">
      {/* Responsive 16:9 wrapper */}
      <div className="relative w-full aspect-video bg-bg-muted">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      </div>

      {/* Caption */}
      <div className="px-4 py-3 border-t border-border">
        <p className="font-serif text-sm text-fg-muted">{title}</p>
      </div>
    </div>
  );
}
