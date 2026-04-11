import { getTranslations, setRequestLocale } from "next-intl/server";
import { client } from "@/lib/sanity/client";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import type { SiteSettings, LegalInfo } from "@/types/sanity";

export const revalidate = 60;

const DEFAULT_SUPERVISORY_AUTHORITY =
  "Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LfDI NRW), Kavalleriestraße 2-4, 40213 Düsseldorf";

function isFullyConfigured(legal: LegalInfo | undefined): boolean {
  if (!legal) return false;
  return Boolean(
    legal.legalName?.trim() &&
      legal.street?.trim() &&
      legal.postalCode?.trim() &&
      legal.city?.trim() &&
      legal.email?.trim()
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
    title: `${t("datenschutzTitle")} — Andreas Magdanz`,
    robots: isLive
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function DatenschutzPage({
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

  const controllerName = legal?.legalName?.trim() || "[Name]";
  const controllerStreet = legal?.street?.trim() || "[Straße und Hausnummer]";
  const controllerCity =
    legal?.postalCode?.trim() && legal?.city?.trim()
      ? `${legal.postalCode.trim()} ${legal.city.trim()}`
      : "[PLZ Ort]";
  const controllerCountry = legal?.country?.trim() || "Deutschland";
  const controllerEmail = legal?.email?.trim() || "[E-Mail]";
  const supervisoryAuthority =
    legal?.supervisoryAuthority?.trim() || DEFAULT_SUPERVISORY_AUTHORITY;

  return (
    <div className="px-8 md:px-12 lg:px-16 py-16">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
            {t("datenschutzTitle")}
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
          {/* 1. Overview */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("datenschutz.overview.title")}
            </h2>
            <h3 className="font-serif text-lg text-fg mt-4 mb-2">
              {t("datenschutz.overview.generalHeading")}
            </h3>
            <p>{t("datenschutz.overview.general")}</p>
            <h3 className="font-serif text-lg text-fg mt-6 mb-2">
              {t("datenschutz.overview.collectionHeading")}
            </h3>
            <p>{t("datenschutz.overview.collection")}</p>
          </section>

          {/* 2. Controller */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("datenschutz.controller.title")}
            </h2>
            <p>{t("datenschutz.controller.intro")}</p>
            <address className="not-italic whitespace-pre-line mt-3">
              {`${controllerName}\n${controllerStreet}\n${controllerCity}\n${controllerCountry}`}
            </address>
            <p className="mt-2">
              {t("datenschutz.controller.emailLabel")}:{" "}
              {legal?.email ? (
                <a
                  href={`mailto:${controllerEmail}`}
                  className="hover:text-accent transition-colors"
                >
                  {controllerEmail}
                </a>
              ) : (
                controllerEmail
              )}
            </p>
          </section>

          {/* 3. Collection */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("datenschutz.collection.title")}
            </h2>
            <h3 className="font-serif text-lg text-fg mt-4 mb-2">
              {t("datenschutz.collection.logsHeading")}
            </h3>
            <p>{t("datenschutz.collection.logs")}</p>

            <h3 className="font-serif text-lg text-fg mt-6 mb-2">
              {t("datenschutz.collection.formHeading")}
            </h3>
            <p>{t("datenschutz.collection.form")}</p>
          </section>

          {/* 4. Processors */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("datenschutz.processors.title")}
            </h2>
            <p>{t("datenschutz.processors.intro")}</p>

            <h3 className="font-serif text-lg text-fg mt-6 mb-2">
              {t("datenschutz.processors.vercelHeading")}
            </h3>
            <p>
              {t("datenschutz.processors.vercel")}{" "}
              <a
                href="https://vercel.com/legal/dpa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-fg transition-colors underline underline-offset-4"
              >
                {t("datenschutz.processors.vercelDpaLabel")}
              </a>
              .
            </p>

            <h3 className="font-serif text-lg text-fg mt-6 mb-2">
              {t("datenschutz.processors.sanityHeading")}
            </h3>
            <p>
              {t("datenschutz.processors.sanity")}{" "}
              <a
                href="https://www.sanity.io/legal/dpa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-fg transition-colors underline underline-offset-4"
              >
                {t("datenschutz.processors.sanityDpaLabel")}
              </a>
              .
            </p>

            <h3 className="font-serif text-lg text-fg mt-6 mb-2">
              {t("datenschutz.processors.resendHeading")}
            </h3>
            <p>
              {t("datenschutz.processors.resend")}{" "}
              <a
                href="https://resend.com/legal/dpa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-fg transition-colors underline underline-offset-4"
              >
                {t("datenschutz.processors.resendDpaLabel")}
              </a>
              .
            </p>

            <h3 className="font-serif text-lg text-fg mt-6 mb-2">
              {t("datenschutz.processors.fontsHeading")}
            </h3>
            <p>{t("datenschutz.processors.fonts")}</p>

            <h3 className="font-serif text-lg text-fg mt-6 mb-2">
              {t("datenschutz.processors.mediapipeHeading")}
            </h3>
            <p>{t("datenschutz.processors.mediapipe")}</p>
          </section>

          {/* 5. Cookies */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("datenschutz.cookies.title")}
            </h2>
            <p>{t("datenschutz.cookies.body")}</p>
          </section>

          {/* 6. Rights */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("datenschutz.rights.title")}
            </h2>
            <p>{t("datenschutz.rights.intro")}</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>{t("datenschutz.rights.access")}</li>
              <li>{t("datenschutz.rights.rectification")}</li>
              <li>{t("datenschutz.rights.erasure")}</li>
              <li>{t("datenschutz.rights.restriction")}</li>
              <li>{t("datenschutz.rights.portability")}</li>
              <li>{t("datenschutz.rights.objection")}</li>
              <li>
                {t("datenschutz.rights.complaintIntro")}
                {supervisoryAuthority}.
              </li>
            </ul>
            <p className="mt-4">{t("datenschutz.rights.outro")}</p>
          </section>

          {/* 7. SSL */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("datenschutz.ssl.title")}
            </h2>
            <p>{t("datenschutz.ssl.body")}</p>
          </section>

          {/* 8. Changes */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("datenschutz.changes.title")}
            </h2>
            <p>{t("datenschutz.changes.body")}</p>
          </section>

          <p className="pt-6 text-xs text-fg-muted/70">
            {t("lastUpdatedLabel")}: {t("lastUpdatedDate")}
          </p>
        </div>
      </div>
    </div>
  );
}
