import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact — Andreas Magdanz",
  description:
    "Contact Andreas Magdanz — studio and gallery enquiries, exhibition loans, publication requests.",
};

const CONTACT_INFO = [
  {
    label: "Gallery",
    name: "Janet Borden Inc.",
    lines: [
      "560 Broadway, Suite 601",
      "New York, NY 10012",
      "United States",
    ],
    link: {
      href: "https://www.janetbordeninc.com",
      label: "janetbordeninc.com",
    },
  },
  {
    label: "Studio",
    name: "Andreas Magdanz",
    lines: [
      "Kapellenstraße 66",
      "D-52066 Aachen",
      "Germany",
    ],
    link: null,
  },
  {
    label: "University",
    name: "HAWK Hildesheim/Holzminden/Göttingen",
    lines: [
      "Faculty of Design",
      "Lübecker Straße 2",
      "31134 Hildesheim, Germany",
    ],
    link: {
      href: "https://www.hawk.de",
      label: "hawk.de",
    },
  },
];

export default function ContactPage() {
  return (
    <div className="px-8 md:px-12 lg:px-16 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <header className="mb-16">
          <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
            Contact
          </h1>
          <div className="mt-4 w-12 h-px bg-accent" />
        </header>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16">
          {/* Left: Contact form */}
          <div>
            <p className="font-sans text-sm text-fg-muted mb-8 leading-relaxed max-w-md">
              For exhibition enquiries, press requests, print sales, or general
              correspondence, please use the form below.
            </p>
            <ContactForm />
          </div>

          {/* Right: Contact info cards */}
          <aside className="space-y-6">
            {CONTACT_INFO.map((info) => (
              <div
                key={info.label}
                className="border border-border p-6 bg-bg-muted/20"
              >
                <p className="font-sans text-xs uppercase tracking-widest text-accent mb-3">
                  {info.label}
                </p>
                <p className="font-serif text-lg text-fg mb-2">{info.name}</p>
                <address className="not-italic">
                  {info.lines.map((line, i) => (
                    <p key={i} className="font-sans text-sm text-fg-muted">
                      {line}
                    </p>
                  ))}
                </address>
                {info.link && (
                  <a
                    href={info.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 font-sans text-xs text-accent hover:text-fg transition-colors duration-200"
                  >
                    {info.link.label}
                  </a>
                )}
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
