import type { MetadataRoute } from "next";
import { client } from "@/lib/sanity/client";
import { allProjectsQuery } from "@/lib/sanity/queries";
import type { Project } from "@/types/sanity";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.andreasmagdanz.de";

// Static routes with their priorities and change frequencies
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/work`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.8,
  },
  {
    url: `${BASE_URL}/cv`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/exhibitions`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/publications`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${BASE_URL}/media`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${BASE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.5,
  },
];

// Placeholder slugs for when Sanity is not connected
const PLACEHOLDER_SLUGS = [
  "eifel",
  "garzweiler",
  "dienststelle-marienthal",
  "auschwitz-birkenau",
  "bnd-standort-pullach",
  "stuttgart-stammheim",
  "bitterfeld",
  "kraftwerk",
  "transitraeume",
  "archive",
  "ns-ordensburg-vogelsang",
  "hambacher-forst",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let projectRoutes: MetadataRoute.Sitemap = [];

  try {
    const projects = await client.fetch<Pick<Project, "slug">[]>(
      allProjectsQuery
    );

    projectRoutes = projects.map((p) => ({
      url: `${BASE_URL}/work/${p.slug.current}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    }));
  } catch {
    // Sanity not connected — use placeholder slugs
    projectRoutes = PLACEHOLDER_SLUGS.map((slug) => ({
      url: `${BASE_URL}/work/${slug}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    }));
  }

  return [...STATIC_ROUTES, ...projectRoutes];
}
