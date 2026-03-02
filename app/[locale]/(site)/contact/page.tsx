import { getTranslations, setRequestLocale } from "next-intl/server";
import { client } from "@/lib/sanity/client";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/types/sanity";
import ContactForm from "@/components/contact/ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: `${t("title")} — Andreas Magdanz`,
    description: t("description"),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  let settings: SiteSettings | null = null;

  try {
    settings = await client.fetch<SiteSettings>(siteSettingsQuery);
  } catch {
    // Sanity not connected
  }

  const galleryName = settings?.galleryName ?? "Janet Borden Inc.";
  const galleryAddress = settings?.galleryAddress ?? "560 Broadway, Suite 601\nNew York, NY 10012\nUnited States";
  const galleryUrl = settings?.galleryUrl ?? "https://www.janetbordeninc.com";
  const contactAddress = settings?.contactAddress ?? "Kapellenstrasse 66\nD-52066 Aachen\nGermany";
  const contactEmail = settings?.contactEmail ?? "magdanz@andreasmagdanz.de";
  const contactPhone = settings?.contactPhone ?? "";
  const universityInfo = settings?.universityInfo ?? "HAWK Hildesheim/Holzminden/Gottingen";
  const universityAddress = settings?.universityAddress ?? "Fakultat Gestaltung\nLubecker Strasse 2\n31134 Hildesheim, Germany";

  return (
    <div className="px-8 md:px-12 lg:px-16 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <header className="mb-16">
          <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
            {t("title")}
          </h1>
          <div className="mt-4 w-12 h-px bg-accent" />
        </header>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16">
          {/* Left: Contact form */}
          <div>
            <p className="font-sans text-sm text-fg-muted mb-8 leading-relaxed max-w-md">
              {t("description")}
            </p>
            <ContactForm />
          </div>

          {/* Right: Contact info cards */}
          <aside className="space-y-6">
            {/* Gallery */}
            <div className="border border-border p-6 bg-bg-muted/20">
              <p className="font-sans text-xs uppercase tracking-widest text-accent mb-3">
                {t("gallery")}
              </p>
              <p className="font-serif text-lg text-fg mb-2">{galleryName}</p>
              <p className="font-sans text-sm text-fg-muted whitespace-pre-line">
                {galleryAddress}
              </p>
              <a
                href={galleryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 font-sans text-xs text-accent hover:text-fg transition-colors duration-200"
              >
                janetbordeninc.com
              </a>
            </div>

            {/* Studio */}
            <div className="border border-border p-6 bg-bg-muted/20">
              <p className="font-sans text-xs uppercase tracking-widest text-accent mb-3">
                {t("studio")}
              </p>
              <p className="font-serif text-lg text-fg mb-2">Andreas Magdanz</p>
              <address className="not-italic">
                <p className="font-sans text-sm text-fg-muted whitespace-pre-line">
                  {contactAddress}
                </p>
              </address>
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-block mt-3 font-sans text-xs text-accent hover:text-fg transition-colors duration-200"
                >
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <p className="font-sans text-xs text-fg-muted mt-1">
                  Tel: {contactPhone}
                </p>
              )}
            </div>

            {/* University */}
            <div className="border border-border p-6 bg-bg-muted/20">
              <p className="font-sans text-xs uppercase tracking-widest text-accent mb-3">
                {t("university")}
              </p>
              <p className="font-serif text-lg text-fg mb-2">{universityInfo}</p>
              <p className="font-sans text-sm text-fg-muted whitespace-pre-line">
                {universityAddress}
              </p>
              <a
                href="https://www.hawk.de"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 font-sans text-xs text-accent hover:text-fg transition-colors duration-200"
              >
                hawk.de
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
