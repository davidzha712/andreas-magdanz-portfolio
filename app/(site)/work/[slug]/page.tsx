import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/client";
import {
  projectBySlugQuery,
  allProjectsQuery,
} from "@/lib/sanity/queries";
import type { Project } from "@/types/sanity";
import SanityImage from "@/components/shared/SanityImage";
import ProjectMeta from "@/components/work/ProjectMeta";
import ProjectDetailClient from "@/components/work/ProjectDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const projects = await client.fetch<Pick<Project, "slug">[]>(
      allProjectsQuery
    );
    return projects.map((p) => ({ slug: p.slug.current }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const project = await client.fetch<Project>(projectBySlugQuery, { slug });
    if (!project) {
      return { title: "Work — Andreas Magdanz" };
    }

    const description =
      project.seo?.metaDescription ??
      `${project.title}${project.year ? ` (${project.year})` : ""}${project.location ? ` — ${project.location}` : ""} — Photography by Andreas Magdanz`;

    return {
      title: `${project.title} — Andreas Magdanz`,
      description,
      openGraph: project.seo?.ogImage
        ? {
            images: [{ url: project.seo.ogImage.asset._ref }],
          }
        : undefined,
    };
  } catch {
    return {
      title: "Work — Andreas Magdanz",
    };
  }
}

export default async function WorkDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let project: Project | null = null;

  try {
    project = await client.fetch<Project>(projectBySlugQuery, { slug });
  } catch {
    // Sanity not connected
  }

  // Hard 404 only if Sanity returned a definitive null (connected but no record)
  if (project === null && process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== "placeholder") {
    notFound();
  }

  // Fallback UI when Sanity is unavailable
  if (!project) {
    const readableTitle = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return (
      <div className="px-8 md:px-12 lg:px-16 py-16">
        {/* Placeholder hero */}
        <div className="relative w-full aspect-[16/9] bg-bg-muted mb-12 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-fg-muted/20 text-2xl text-center px-8">
              {readableTitle}
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none mb-4">
            {readableTitle}
          </h1>
          <p className="font-sans text-sm text-fg-muted tracking-widest uppercase">
            Photography by Andreas Magdanz
          </p>
        </div>
      </div>
    );
  }

  const hasImages = project.images && project.images.length > 0;
  const hasStatement = project.artistStatement && project.artistStatement.length > 0;

  return (
    <article>
      {/* Full-width hero image */}
      {project.coverImage && (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden">
          <SanityImage
            image={project.coverImage.image}
            alt={project.coverImage.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent" />
        </div>
      )}

      {/* Project header */}
      <div className="px-8 md:px-12 lg:px-16 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-fg tracking-tight leading-none">
            {project.title}
          </h1>

          <div className="flex flex-wrap gap-6 mt-4 font-sans text-sm text-fg-muted">
            {project.year && (
              <span className="tracking-widest uppercase">{project.year}</span>
            )}
            {project.location && (
              <>
                <span className="text-border" aria-hidden="true">—</span>
                <span>{project.location}</span>
              </>
            )}
          </div>

          <div className="mt-6 w-12 h-px bg-accent" />
        </div>
      </div>

      {/* Main content: images + statement + meta */}
      <div className="px-8 md:px-12 lg:px-16 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className={hasImages ? "lg:grid lg:grid-cols-[1fr_280px] lg:gap-12 xl:gap-16" : ""}>
            {/* Left: image sequence + lightbox (client component) */}
            {hasImages && <ProjectDetailClient project={project} />}

            {/* Right: sticky sidebar (desktop) */}
            <aside className={hasImages ? "hidden lg:block" : ""}>
              <div className={hasImages ? "sticky top-24 space-y-10" : "space-y-10"}>
                {/* Artist statement */}
                {hasStatement && (
                  <div>
                    <h2 className="font-sans text-xs tracking-widest uppercase text-fg-muted mb-4">
                      Statement
                    </h2>
                    <div className="font-serif text-base text-fg leading-relaxed space-y-3">
                      <StatementRenderer blocks={project.artistStatement!} />
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <h2 className="font-sans text-xs tracking-widest uppercase text-fg-muted mb-4">
                    Details
                  </h2>
                  <ProjectMeta project={project} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile statement + meta (shown below images on small screens, only when we have the grid layout) */}
      {hasImages && (
        <div className="lg:hidden px-8 md:px-12 pb-16 space-y-10">
          {hasStatement && (
            <div>
              <h2 className="font-sans text-xs tracking-widest uppercase text-fg-muted mb-4">
                Statement
              </h2>
              <div className="font-serif text-base text-fg leading-relaxed">
                <StatementRenderer blocks={project.artistStatement!} />
              </div>
            </div>
          )}
          <div>
            <h2 className="font-sans text-xs tracking-widest uppercase text-fg-muted mb-4">
              Details
            </h2>
            <ProjectMeta project={project} />
          </div>
        </div>
      )}

      {/* Related exhibitions */}
      {(project as Project & { relatedExhibitions?: { _id: string; title: string; venue: string; city: string; year: number }[] }).relatedExhibitions?.length ? (
        <RelatedSection title="Exhibitions">
          <ul className="space-y-3">
            {(project as Project & { relatedExhibitions: { _id: string; title: string; venue: string; city: string; year: number }[] }).relatedExhibitions.map(
              (ex) => (
                <li key={ex._id} className="flex items-baseline gap-3 font-sans text-sm">
                  <span className="text-fg-muted tabular-nums shrink-0">
                    {ex.year}
                  </span>
                  <span className="text-fg">
                    {ex.title}
                    {ex.venue && (
                      <span className="text-fg-muted">, {ex.venue}</span>
                    )}
                    {ex.city && (
                      <span className="text-fg-muted">, {ex.city}</span>
                    )}
                  </span>
                </li>
              )
            )}
          </ul>
        </RelatedSection>
      ) : null}

      {/* Related publications */}
      {(project as Project & { relatedPublications?: { _id: string; title: string; publisher: string; year: number; purchaseUrl?: string }[] }).relatedPublications?.length ? (
        <RelatedSection title="Publications">
          <ul className="space-y-3">
            {(project as Project & { relatedPublications: { _id: string; title: string; publisher: string; year: number; purchaseUrl?: string }[] }).relatedPublications.map(
              (pub) => (
                <li key={pub._id} className="flex items-baseline gap-3 font-sans text-sm">
                  <span className="text-fg-muted tabular-nums shrink-0">
                    {pub.year}
                  </span>
                  <span className="text-fg">
                    {pub.purchaseUrl ? (
                      <a
                        href={pub.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-accent transition-colors duration-200"
                      >
                        {pub.title}
                      </a>
                    ) : (
                      pub.title
                    )}
                    {pub.publisher && (
                      <span className="text-fg-muted">, {pub.publisher}</span>
                    )}
                  </span>
                </li>
              )
            )}
          </ul>
        </RelatedSection>
      ) : null}
    </article>
  );
}

// Simple server-side plain text renderer for the artist statement
import type { PortableTextBlock } from "sanity";

function StatementRenderer({ blocks }: { blocks: PortableTextBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block._type !== "block") return null;
        const text = (block.children as { text: string }[])
          ?.map((child) => child.text)
          .join("");
        if (!text) return null;
        return (
          <p key={block._key ?? i} className="mb-3 last:mb-0">
            {text}
          </p>
        );
      })}
    </>
  );
}

function RelatedSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border px-8 md:px-12 lg:px-16 py-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-serif text-2xl text-fg mb-8">{title}</h2>
        {children}
      </div>
    </section>
  );
}
