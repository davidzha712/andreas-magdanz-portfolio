import { getTranslations, setRequestLocale } from "next-intl/server";
import { client } from "@/lib/sanity/client";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/types/sanity";
import SanityImage from "@/components/shared/SanityImage";
import type { PortableTextBlock } from "sanity";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: `${t("title")} — ${t("subtitle")}`,
    description:
      locale === "en"
        ? "Andreas Magdanz — Photographer, Professor at HAWK Hildesheim. Documentary large-format photography of historically and politically significant sites."
        : "Andreas Magdanz — Fotograf, Professor an der HAWK Hildesheim. Dokumentarische Grossformatfotografie zu historisch und politisch bedeutsamen Orten.",
  };
}

function BlockRenderer({ blocks }: { blocks: PortableTextBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block._type !== "block") return null;
        const text = (block.children as { text: string }[])
          ?.map((child) => child.text)
          .join("");
        if (!text) return null;

        const style = block.style || "normal";
        if (style === "h2") {
          return (
            <h2 key={block._key ?? i} className="font-serif text-3xl text-fg mt-8 mb-4">
              {text}
            </h2>
          );
        }
        if (style === "h3") {
          return (
            <h3 key={block._key ?? i} className="font-serif text-xl text-fg mt-6 mb-3">
              {text}
            </h3>
          );
        }
        return (
          <p key={block._key ?? i} className="font-serif text-lg text-fg leading-relaxed mb-4">
            {text}
          </p>
        );
      })}
    </>
  );
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  let settings: SiteSettings | null = null;

  try {
    settings = await client.fetch<SiteSettings>(siteSettingsQuery, { locale });
  } catch {
    // Sanity not connected
  }

  const hasBio = settings?.artistBio && (settings.artistBio as PortableTextBlock[]).length > 0;
  const hasTeaching = settings?.teachingHistory && (settings.teachingHistory as PortableTextBlock[]).length > 0;

  return (
    <div className="px-8 md:px-12 lg:px-16 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <header className="mb-16">
          <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
            {t("title")}
          </h1>
          <p className="mt-4 font-sans text-sm text-fg-muted tracking-wide">
            {t("subtitle")}
          </p>
          <div className="mt-6 w-12 h-px bg-accent" />
        </header>

        {/* Split layout: portrait + biography */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-20">
          {/* Left: portrait */}
          <div className="lg:w-1/3 shrink-0">
            <div className="sticky top-24">
              {settings?.artistPortrait ? (
                <div className="relative aspect-[3/4] overflow-hidden">
                  <SanityImage
                    image={settings.artistPortrait}
                    alt="Andreas Magdanz"
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative aspect-[3/4] bg-bg-muted overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-fg-muted/20"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
              )}
              <p className="mt-3 font-sans text-xs text-fg-muted">
                Andreas Magdanz
                <span className="block text-fg-muted/60">
                  {locale === "en" ? "Aachen, Germany" : "Aachen, Deutschland"}
                </span>
              </p>
            </div>
          </div>

          {/* Right: biography from CMS */}
          <div className="lg:w-2/3">
            {hasBio ? (
              <BlockRenderer blocks={settings!.artistBio as PortableTextBlock[]} />
            ) : (
              <div className="space-y-5">
                {locale === "en" ? (
                  <>
                    <p className="font-serif text-lg text-fg leading-relaxed">
                      Andreas Magdanz (b. 1964, Monchengladbach) is a German photographer known for his documentary large-format series examining historically and politically significant sites.
                    </p>
                    <p className="font-serif text-lg text-fg leading-relaxed">
                      His work includes projects such as Dienststelle Marienthal, Auschwitz-Birkenau, BND-Standort Pullach, NS-Ordensburg Vogelsang, and Stuttgart Stammheim.
                    </p>
                    <p className="font-serif text-lg text-fg leading-relaxed">
                      Since 2005, he has been Professor of Photography at HAWK Hildesheim/Holzminden/Gottingen. He lives and works in Aachen.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-serif text-lg text-fg leading-relaxed">
                      Andreas Magdanz (geb. 1964, Monchengladbach) ist ein deutscher Fotograf, bekannt fur seine dokumentarischen Grossformatserien, die historisch und politisch bedeutsame Orte untersuchen.
                    </p>
                    <p className="font-serif text-lg text-fg leading-relaxed">
                      Seine Arbeiten umfassen Projekte wie Dienststelle Marienthal, Auschwitz-Birkenau, BND-Standort Pullach, NS-Ordensburg Vogelsang und Stuttgart Stammheim.
                    </p>
                    <p className="font-serif text-lg text-fg leading-relaxed">
                      Seit 2005 ist er Professor fur Fotografie an der HAWK Hildesheim/Holzminden/Gottingen. Er lebt und arbeitet in Aachen.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Teaching section from CMS */}
        {hasTeaching && (
          <section className="border-t border-border pt-16 mb-16">
            <BlockRenderer blocks={settings!.teachingHistory as PortableTextBlock[]} />
          </section>
        )}

        {/* Gallery representation */}
        <section className="border-t border-border pt-16">
          <div className="mb-8">
            <h2 className="font-serif text-3xl text-fg">{t("representation")}</h2>
            <div className="mt-3 w-10 h-px bg-accent" />
          </div>

          <div className="sm:grid sm:grid-cols-[160px_1fr] sm:gap-8">
            <span className="font-sans text-sm text-fg-muted tracking-wide mb-1 sm:mb-0 block">
              New York
            </span>
            <div>
              <p className="font-serif text-lg text-fg">
                {settings?.galleryName ?? "Janet Borden Inc."}
              </p>
              {settings?.galleryAddress ? (
                <p className="font-sans text-sm text-fg-muted mt-0.5 whitespace-pre-line">
                  {settings.galleryAddress}
                </p>
              ) : (
                <p className="font-sans text-sm text-fg-muted mt-0.5">
                  560 Broadway, Suite 601, New York, NY 10012
                </p>
              )}
              <a
                href={settings?.galleryUrl ?? "https://www.janetbordeninc.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-xs text-accent hover:text-fg transition-colors duration-200 mt-1 inline-block"
              >
                janetbordeninc.com
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
