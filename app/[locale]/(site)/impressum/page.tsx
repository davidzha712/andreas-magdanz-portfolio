import { getTranslations, setRequestLocale } from "next-intl/server";
import { client } from "@/lib/sanity/client";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import type { SiteSettings, LegalInfo } from "@/types/sanity";

export const revalidate = 60;

const PLACEHOLDER = {
  name: "[Name]",
  street: "[Straße und Hausnummer]",
  postalCode: "[PLZ]",
  city: "[Ort]",
  phone: "[Telefon]",
  email: "[E-Mail]",
  vatId: "[USt-IdNr.]",
} as const;

function isFullyConfigured(legal: LegalInfo | undefined): boolean {
  if (!legal) return false;
  return Boolean(
    legal.legalName?.trim() &&
      legal.street?.trim() &&
      legal.postalCode?.trim() &&
      legal.city?.trim() &&
      legal.phone?.trim() &&
      legal.email?.trim() &&
      legal.vatId?.trim()
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  const settings = await client.fetch<SiteSettings | null>(
    siteSettingsQuery,
    { locale }
  );

  const isLive =
    settings?.legalInfo?.published === true &&
    isFullyConfigured(settings.legalInfo);

  return {
    title: `${t("impressumTitle")} — Andreas Magdanz`,
    robots: isLive
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const settings = await client.fetch<SiteSettings | null>(
    siteSettingsQuery,
    { locale }
  );

  const legal = settings?.legalInfo;
  const isLive =
    legal?.published === true && isFullyConfigured(legal);

  // Resolve fields with fallback to placeholders
  const name = legal?.legalName?.trim() || PLACEHOLDER.name;
  const street = legal?.street?.trim() || PLACEHOLDER.street;
  const postalCode = legal?.postalCode?.trim() || PLACEHOLDER.postalCode;
  const city = legal?.city?.trim() || PLACEHOLDER.city;
  const country = legal?.country?.trim() || t("impressum.tmg.country");
  const phone = legal?.phone?.trim() || PLACEHOLDER.phone;
  const email = legal?.email?.trim() || PLACEHOLDER.email;
  const vatId = legal?.vatId?.trim() || PLACEHOLDER.vatId;
  const responsibleName = legal?.responsibleName?.trim() || name;
  const responsibleAddress =
    legal?.responsibleAddress?.trim() || `${street}\n${postalCode} ${city}`;

  return (
    <div className="px-8 md:px-12 lg:px-16 py-16">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
            {t("impressumTitle")}
          </h1>
          <div className="mt-4 w-12 h-px bg-accent" />
        </header>

        {!isLive && (
          <p
            className="mb-10 border border-accent/40 bg-accent/5 px-4 py-3 font-sans text-xs uppercase tracking-widest text-accent"
            role="note"
          >
            {t("draftNotice")}
          </p>
        )}

        <div className="space-y-12 font-sans text-sm text-fg-muted leading-relaxed">
          {/* § 5 TMG */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.tmg.title")}
            </h2>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
              <dt className="text-fg">{t("impressum.tmg.nameLabel")}</dt>
              <dd>{name}</dd>
              <dt className="text-fg">{t("impressum.tmg.addressLabel")}</dt>
              <dd className="whitespace-pre-line">
                {`${street}\n${postalCode} ${city}`}
              </dd>
              <dt className="text-fg">{t("impressum.tmg.countryLabel")}</dt>
              <dd>{country}</dd>
            </dl>
          </section>

          {/* Kontakt */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.contact.title")}
            </h2>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
              <dt className="text-fg">{t("impressum.contact.phoneLabel")}</dt>
              <dd>{phone}</dd>
              <dt className="text-fg">{t("impressum.contact.emailLabel")}</dt>
              <dd>
                {legal?.email ? (
                  <a
                    href={`mailto:${email}`}
                    className="hover:text-accent transition-colors"
                  >
                    {email}
                  </a>
                ) : (
                  email
                )}
              </dd>
            </dl>
          </section>

          {/* USt-ID */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.vat.title")}
            </h2>
            <p>
              {t("impressum.vat.body")} <span>{vatId}</span>
            </p>
          </section>

          {/* Verantwortlich nach § 55 RStV */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.responsible.title")}
            </h2>
            <address className="not-italic whitespace-pre-line">
              {`${responsibleName}\n${responsibleAddress}`}
            </address>
          </section>

          {/* Haftungsausschluss */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.disclaimer.title")}
            </h2>
            <h3 className="font-serif text-lg text-fg mt-4 mb-2">
              {t("impressum.disclaimer.contentHeading")}
            </h3>
            <p>{t("impressum.disclaimer.content")}</p>

            <h3 className="font-serif text-lg text-fg mt-6 mb-2">
              {t("impressum.disclaimer.linksHeading")}
            </h3>
            <p>{t("impressum.disclaimer.links")}</p>

            <h3 className="font-serif text-lg text-fg mt-6 mb-2">
              {t("impressum.disclaimer.copyrightHeading")}
            </h3>
            <p>{t("impressum.disclaimer.copyright")}</p>
          </section>

          {/* EU-Streitschlichtung */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.euDispute.title")}
            </h2>
            <p>
              {t("impressum.euDispute.body")}{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-fg transition-colors underline underline-offset-4"
              >
                {t("impressum.euDispute.linkLabel")}
              </a>
              . {t("impressum.euDispute.suffix")}
            </p>
          </section>

          {/* Verbraucherstreitbeilegung */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.consumerDispute.title")}
            </h2>
            <p>{t("impressum.consumerDispute.body")}</p>
          </section>

          <p className="pt-6 text-xs text-fg-muted/70">
            {t("lastUpdatedLabel")}: {t("lastUpdatedDate")}
          </p>
        </div>
      </div>
    </div>
  );
}
