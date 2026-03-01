"use client";

import { PortableText, PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "sanity";
import SanityImage from "./SanityImage";
import type { SanityImageAsset } from "@/types/sanity";

interface PortableTextRendererProps {
  value: PortableTextBlock[];
  className?: string;
}

interface ImageValue {
  _type: "image";
  asset: SanityImageAsset["asset"];
  hotspot?: SanityImageAsset["hotspot"];
  crop?: SanityImageAsset["crop"];
  alt?: string;
  caption?: string;
}

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="font-serif text-3xl mt-10 mb-4 text-fg">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-serif text-2xl mt-8 mb-3 text-fg">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-accent pl-4 italic text-fg-muted my-6">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="text-fg leading-relaxed mb-4">{children}</p>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-accent hover:text-accent-hover transition-colors duration-200"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }: { value: ImageValue }) => {
      const imageAsset: SanityImageAsset = {
        _type: "image",
        asset: value.asset,
        hotspot: value.hotspot,
        crop: value.crop,
      };
      return (
        <figure className="my-8">
          <SanityImage
            image={imageAsset}
            alt={value.alt ?? ""}
            className="w-full h-auto"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
          {value.caption && (
            <figcaption className="mt-2 text-xs text-fg-muted text-center font-sans tracking-wide">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

export default function PortableTextRenderer({
  value,
  className,
}: PortableTextRendererProps) {
  if (!value || value.length === 0) return null;

  return (
    <div className={className}>
      <PortableText value={value} components={components} />
    </div>
  );
}
