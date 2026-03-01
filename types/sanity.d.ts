import type { PortableTextBlock } from "sanity";

export interface SanityImageAsset {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface ProjectImage {
  _key: string;
  _type: "projectImage";
  image: SanityImageAsset;
  alt: string;
  caption?: string;
}

export interface SEOFields {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: SanityImageAsset;
}

export interface Project {
  _id: string;
  _type: "project";
  title: string;
  slug: { current: string };
  coverImage: ProjectImage;
  images: ProjectImage[];
  year: string;
  location?: string;
  artistStatement?: PortableTextBlock[];
  description?: PortableTextBlock[];
  isFeatured: boolean;
  order?: number;
  seo?: SEOFields;
}

export interface Exhibition {
  _id: string;
  _type: "exhibition";
  title: string;
  type: "solo" | "group";
  venue: string;
  city: string;
  country: string;
  year: number;
  endYear?: number;
  venueImage?: SanityImageAsset;
  relatedProject?: { _ref: string };
  description?: PortableTextBlock[];
}

export interface Publication {
  _id: string;
  _type: "publication";
  title: string;
  publisher: string;
  year: number;
  isbn?: string;
  coverImage?: SanityImageAsset;
  purchaseUrl?: string;
  description?: PortableTextBlock[];
}

export interface MediaItem {
  _id: string;
  _type: "mediaItem";
  title: string;
  mediaType: "audio" | "video" | "press";
  embedUrl?: string;
  externalUrl?: string;
  source: string;
  date: string;
  description?: PortableTextBlock[];
  thumbnail?: SanityImageAsset;
}

export interface CVEntry {
  _id: string;
  _type: "cvEntry";
  category:
    | "soloExhibition"
    | "groupExhibition"
    | "award"
    | "collection"
    | "teaching"
    | "education"
    | "publication"
    | "grant";
  year: number;
  endYear?: number;
  title: string;
  institution?: string;
  location?: string;
  description?: string;
}

export interface SiteSettings {
  _id: string;
  _type: "siteSettings";
  siteTitle: string;
  siteDescription: string;
  homeHeroProject?: Project;
  ogImage?: SanityImageAsset;
  galleryName?: string;
  galleryUrl?: string;
  galleryEmail?: string;
  contactEmail?: string;
  contactAddress?: string;
  contactPhone?: string;
  universityInfo?: string;
}
