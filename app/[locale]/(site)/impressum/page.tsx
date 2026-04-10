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

        <div className="space-y-10 font-sans text-sm text-fg-muted leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              Angaben gemäß § 5 TMG
            </h2>
            <address className="not-italic whitespace-pre-line">
              {/* TODO: Full legal name */}
              Andreas Magdanz{"\n"}
              {/* TODO: Street and house number */}
              [Straße und Hausnummer]{"\n"}
              {/* TODO: Postal code and city */}
              [PLZ Ort]{"\n"}
              {/* TODO: Country */}
              Deutschland
            </address>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">Kontakt</h2>
            <p>
              {/* TODO: Phone number */}
              Telefon: [Telefonnummer]
            </p>
            <p>
              {/* TODO: Contact email */}
              E-Mail: [E-Mail-Adresse]
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              Umsatzsteuer-ID
            </h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
              {/* TODO: USt-IdNr or note Kleinunternehmer §19 UStG */}
              {" "}
              [USt-IdNr. oder Hinweis gemäß § 19 UStG]
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <address className="not-italic whitespace-pre-line">
              {/* TODO: Name of person responsible for content */}
              Andreas Magdanz{"\n"}
              [Anschrift wie oben]
            </address>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              Haftungsausschluss
            </h2>
            <h3 className="font-serif text-lg text-fg mt-4 mb-2">
              Haftung für Inhalte
            </h3>
            <p>
              Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für
              die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können
              wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir
              gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
              als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
              gespeicherte fremde Informationen zu überwachen oder nach Umständen
              zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>

            <h3 className="font-serif text-lg text-fg mt-4 mb-2">
              Haftung für Links
            </h3>
            <p>
              Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
              Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
              fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
              der Seiten verantwortlich.
            </p>

            <h3 className="font-serif text-lg text-fg mt-4 mb-2">Urheberrecht</h3>
            <p>
              Die durch den Seitenbetreiber erstellten Inhalte und Werke auf
              diesen Seiten unterliegen dem deutschen Urheberrecht. Die
              Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
              Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
              schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
