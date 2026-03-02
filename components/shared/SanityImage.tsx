import Image from "next/image";
import type { SanityImageAsset } from "@/types/sanity";
import { urlFor } from "@/lib/sanity/image";

interface SanityImageProps {
  image: SanityImageAsset;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

export default function SanityImage({
  image,
  alt,
  width,
  height,
  fill = false,
  sizes,
  className,
  priority = false,
}: SanityImageProps) {
  const builder = urlFor(image);

  // Build optimized URL — use auto=format for AVIF/WebP negotiation
  const sized = builder.width(width ?? 1200);
  const src = fill
    ? builder.auto("format").fit("max").url()
    : (height ? sized.height(height) : sized)
        .auto("format")
        .fit("max")
        .url();

  // Apply Sanity hotspot as CSS object-position so object-cover
  // crops around the photographer's chosen focal point
  const hotspot = image.hotspot;
  const objectPosition = hotspot
    ? `${hotspot.x * 100}% ${hotspot.y * 100}%`
    : undefined;

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={true}
        sizes={sizes ?? "100vw"}
        className={className}
        style={objectPosition ? { objectPosition } : undefined}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1200}
      height={height ?? 800}
      sizes={sizes}
      className={className}
      style={objectPosition ? { objectPosition } : undefined}
      priority={priority}
    />
  );
}
