import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: `${t("datenschutzTitle")} — Andreas Magdanz`,
    robots: { index: false, follow: false },
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

  return (
    <div className="px-8 md:px-12 lg:px-16 py-16">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
            {t("datenschutzTitle")}
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
              1. Verantwortlicher
            </h2>
            <p>
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO)
              ist:
            </p>
            <address className="not-italic whitespace-pre-line mt-3">
              {/* TODO: Controller contact — same as Impressum */}
              Andreas Magdanz{"\n"}
              [Straße und Hausnummer]{"\n"}
              [PLZ Ort]{"\n"}
              Deutschland{"\n"}
              E-Mail: [E-Mail-Adresse]
            </address>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              2. Datenerfassung auf unserer Website
            </h2>
            <h3 className="font-serif text-lg text-fg mt-4 mb-2">
              Server-Log-Dateien
            </h3>
            <p>
              Der Provider der Seiten erhebt und speichert automatisch
              Informationen in sogenannten Server-Log-Dateien, die Ihr Browser
              automatisch an uns übermittelt. Dies sind: Browsertyp und
              Browserversion, verwendetes Betriebssystem, Referrer URL, Hostname
              des zugreifenden Rechners, Uhrzeit der Serveranfrage und
              IP-Adresse. Eine Zusammenführung dieser Daten mit anderen
              Datenquellen wird nicht vorgenommen. Rechtsgrundlage: Art. 6 Abs.
              1 lit. f DSGVO (berechtigtes Interesse an technisch fehlerfreier
              Darstellung).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">3. Cookies</h2>
            <p>
              {/* TODO: Adjust if tracking cookies are added */}
              Unsere Website verwendet ausschließlich technisch notwendige
              Cookies, die für den Betrieb der Seite erforderlich sind (z. B.
              zum Speichern der Spracheinstellung und des Farbschemas). Es
              werden keine Tracking- oder Marketing-Cookies eingesetzt.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              4. Kontaktformular
            </h2>
            <p>
              Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden
              Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort
              angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für
              den Fall von Anschlussfragen bei uns gespeichert. Der Versand
              erfolgt über den Dienstleister{" "}
              <strong className="text-fg">Resend</strong> (Resend, Inc., USA),
              der als Auftragsverarbeiter gemäß Art. 28 DSGVO tätig wird.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung)
              bzw. Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              5. Inhalte aus dem CMS (Sanity)
            </h2>
            <p>
              Redaktionelle Inhalte dieser Website werden über das
              Content-Management-System{" "}
              <strong className="text-fg">Sanity</strong> (Sanity.io, Norwegen)
              verwaltet und ausgeliefert. Beim Abruf von Bildern und Inhalten
              wird Ihre IP-Adresse technisch bedingt an Sanity übermittelt.
              Sanity ist ein Auftragsverarbeiter gemäß Art. 28 DSGVO.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">6. Hosting</h2>
            <p>
              Diese Website wird bei{" "}
              <strong className="text-fg">Vercel Inc.</strong> (340 S Lemon Ave
              #4133, Walnut, CA 91789, USA) gehostet. Vercel verarbeitet in
              unserem Auftrag personenbezogene Daten (insbesondere IP-Adressen
              in Server-Logs) als Auftragsverarbeiter gemäß Art. 28 DSGVO. Da
              eine Übermittlung in die USA stattfinden kann, stützen wir uns
              hierfür auf die Standardvertragsklauseln der EU-Kommission sowie
              ggf. das EU-US Data Privacy Framework. Weitere Informationen
              finden Sie in der Datenschutzerklärung von Vercel:{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-fg transition-colors"
              >
                vercel.com/legal/privacy-policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-fg mb-4">
              7. Ihre Rechte
            </h2>
            <p>
              Sie haben jederzeit das Recht auf unentgeltliche Auskunft über
              Ihre gespeicherten personenbezogenen Daten, deren Herkunft und
              Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf
              Berichtigung, Sperrung oder Löschung dieser Daten. Ihnen stehen
              insbesondere folgende Rechte zu:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>
                Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)
              </li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
              <li>
                Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO)
              </li>
            </ul>
            <p className="mt-3">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an den oben
              genannten Verantwortlichen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
