import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: `${t("impressumTitle")} — Andreas Magdanz`,
    robots: { index: false, follow: false },
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

  return (
    <div className="px-8 md:px-12 lg:px-16 py-16">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
            {t("impressumTitle")}
          </h1>
          <div className="mt-4 w-12 h-px bg-accent" />
        </header>

        {/* Draft notice — remove after legal review */}
        <p
          className="mb-10 border border-accent/40 bg-accent/5 px-4 py-3 font-sans text-xs uppercase tracking-widest text-accent"
          role="note"
        >
          {t("draftNotice")}
        </p>

        <div className="space-y-12 font-sans text-sm text-fg-muted leading-relaxed">
          {/* § 5 TMG */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.tmg.title")}
            </h2>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
              <dt className="text-fg">{t("impressum.tmg.nameLabel")}</dt>
              <dd>[Name]</dd>
              <dt className="text-fg">{t("impressum.tmg.addressLabel")}</dt>
              <dd className="whitespace-pre-line">
                {"[Straße und Hausnummer]\n[PLZ Ort]"}
              </dd>
              <dt className="text-fg">{t("impressum.tmg.countryLabel")}</dt>
              <dd>{t("impressum.tmg.country")}</dd>
            </dl>
          </section>

          {/* Kontakt */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.contact.title")}
            </h2>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
              <dt className="text-fg">{t("impressum.contact.phoneLabel")}</dt>
              <dd>[Telefon]</dd>
              <dt className="text-fg">{t("impressum.contact.emailLabel")}</dt>
              <dd>[E-Mail]</dd>
            </dl>
          </section>

          {/* USt-ID */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.vat.title")}
            </h2>
            <p>
              {t("impressum.vat.body")} <span>[USt-IdNr.]</span>
            </p>
          </section>

          {/* Verantwortlich nach § 55 RStV */}
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              {t("impressum.responsible.title")}
            </h2>
            <address className="not-italic whitespace-pre-line">
              {"[Name]\n[Straße und Hausnummer]\n[PLZ Ort]"}
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
