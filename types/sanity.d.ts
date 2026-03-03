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
  artistStatementEn?: PortableTextBlock[];
  description?: PortableTextBlock[];
  descriptionEn?: PortableTextBlock[];
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
  countryEn?: string;
  year: number;
  endYear?: number;
  venueImage?: SanityImageAsset;
  relatedProject?: { _ref: string };
  description?: PortableTextBlock[];
  descriptionEn?: PortableTextBlock[];
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
  descriptionEn?: PortableTextBlock[];
}

export interface SanityFileAsset {
  _type: "file";
  asset: {
    _ref: string;
    _type: "reference";
    url?: string;
  };
}

export interface MediaItem {
  _id: string;
  _type: "mediaItem";
  title: string;
  titleEn?: string;
  mediaType: "audio" | "video" | "press";
  embedUrl?: string;
  externalUrl?: string;
  pdfFile?: SanityFileAsset;
  pdfUrl?: string;
  source: string;
  date: string;
  description?: PortableTextBlock[];
  descriptionEn?: PortableTextBlock[];
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
  titleEn?: string;
  institution?: string;
  location?: string;
  description?: string;
  descriptionEn?: string;
}

// Search types (lightweight projections for client-side search)
export interface SearchProject {
  _id: string;
  title: string;
  slug: string;
  year: string;
  location?: string;
}

export interface SearchExhibition {
  _id: string;
  title: string;
  venue: string;
  city: string;
  country: string;
  year: number;
  type: "solo" | "group";
}

export interface SearchPublication {
  _id: string;
  title: string;
  publisher: string;
  year: number;
}

export interface SearchCVEntry {
  _id: string;
  title: string;
  category: string;
  year: number;
  institution?: string;
  location?: string;
}

export interface SearchMediaItem {
  _id: string;
  title: string;
  mediaType: "audio" | "video" | "press";
  source: string;
  date: string;
}

export interface SearchData {
  projects: SearchProject[];
  exhibitions: SearchExhibition[];
  publications: SearchPublication[];
  cvEntries: SearchCVEntry[];
  mediaItems: SearchMediaItem[];
}

export interface SiteSettings {
  _id: string;
  _type: "siteSettings";
  siteTitle: string;
  siteDescription: string;
  siteDescriptionEn?: string;
  homeHeroProject?: Project;
  heroImage?: SanityImageAsset;
  heroVideo?: SanityFileAsset;
  heroVideoUrl?: string;
  heroVideoPosition?: string;
  ogImage?: SanityImageAsset;
  artistBio?: unknown[];
  artistBioEn?: unknown[];
  artistPortrait?: SanityImageAsset;
  teachingHistory?: unknown[];
  teachingHistoryEn?: unknown[];
  galleryName?: string;
  galleryUrl?: string;
  galleryEmail?: string;
  galleryAddress?: string;
  contactEmail?: string;
  contactAddress?: string;
  contactPhone?: string;
  universityInfo?: string;
  universityInfoEn?: string;
  universityAddress?: string;
}
