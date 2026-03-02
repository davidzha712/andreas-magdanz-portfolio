import type { MetadataRoute } from "next";
import { client } from "@/lib/sanity/client";
import { allProjectsQuery } from "@/lib/sanity/queries";
import type { Project } from "@/types/sanity";
import { locales, defaultLocale } from "@/i18n/config";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.andreasmagdanz.de";

const STATIC_PATHS = [
  { path: "", changeFrequency: "monthly" as const, priority: 1.0 },
  { path: "/work", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/about", changeFrequency: "yearly" as const, priority: 0.8 },
  { path: "/cv", changeFrequency: "yearly" as const, priority: 0.7 },
  { path: "/exhibitions", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/publications", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/media", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly" as const, priority: 0.5 },
];

function localizedEntry(
  path: string,
  changeFrequency: "monthly" | "yearly",
  priority: number
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${BASE_URL}/${locale}${path}`;
  }
  return {
    url: `${BASE_URL}/${defaultLocale}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = STATIC_PATHS.map((r) =>
    localizedEntry(r.path, r.changeFrequency, r.priority)
  );

  let projectRoutes: MetadataRoute.Sitemap = [];

  try {
    const projects = await client.fetch<Pick<Project, "slug">[]>(
      allProjectsQuery
    );
    projectRoutes = projects.map((p) =>
      localizedEntry(`/work/${p.slug.current}`, "yearly", 0.8)
    );
  } catch {
    // Sanity not connected
  }

  return [...staticRoutes, ...projectRoutes];
}
