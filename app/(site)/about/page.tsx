import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Andreas Magdanz",
  description:
    "Andreas Magdanz (born 1964, Munich) is a German photographer known for large-format documentary series examining historically and politically significant sites.",
};

const BIOGRAPHY = `Andreas Magdanz (born 1964, Munich) is a German photographer known for his large-format documentary series examining historically and politically significant sites. His work investigates architecture as a manifestation of power, ideology, and historical memory.

After studying photography at Folkwangschule Essen and Hochschule für Bildende Künste Braunschweig, Magdanz gained international recognition with his project Dienststelle Marienthal, documenting the former West German government bunker.

His subsequent projects — including Auschwitz-Birkenau, BND-Standort Pullach, NS-Ordensburg Vogelsang, and Stuttgart Stammheim — form a coherent body of work exploring the intersection of architecture, history, and collective memory.

Magdanz's work is held in numerous public and private collections, including SFMOMA San Francisco and Kunstpalast Düsseldorf. He is represented by Janet Borden Inc., New York.

Since 2005, he has served as Professor of Photography at HAWK Hildesheim/Holzminden/Göttingen. He lives and works in Aachen, Germany.`;

const TEACHING = [
  {
    period: "since 2005",
    role: "Professor of Photography",
    institution: "HAWK Hildesheim/Holzminden/Göttingen",
    department: "Faculty of Design",
    location: "Hildesheim, Germany",
  },
  {
    period: "2000–2005",
    role: "Visiting Lecturer, Photography",
    institution: "RWTH Aachen",
    location: "Aachen, Germany",
  },
];

export default function AboutPage() {
  const paragraphs = BIOGRAPHY.split("\n\n").filter(Boolean);

  return (
    <div className="px-8 md:px-12 lg:px-16 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <header className="mb-16">
          <h1 className="font-serif text-5xl md:text-6xl text-fg tracking-tight leading-none">
            About
          </h1>
          <div className="mt-4 w-12 h-px bg-accent" />
        </header>

        {/* Split layout: portrait + biography */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-20">
          {/* Left: portrait placeholder */}
          <div className="lg:w-1/3 shrink-0">
            <div className="sticky top-24">
              <div className="relative aspect-[3/4] bg-bg-muted overflow-hidden">
                {/* Placeholder portrait */}
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
              <p className="mt-3 font-sans text-xs text-fg-muted">
                Andreas Magdanz
                <span className="block text-fg-muted/60">
                  Aachen, Germany
                </span>
              </p>
            </div>
          </div>

          {/* Right: biography text */}
          <div className="lg:w-2/3">
            <div className="space-y-5">
              {paragraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="font-serif text-lg text-fg leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Teaching section */}
        <section className="border-t border-border pt-16">
          <div className="mb-8">
            <h2 className="font-serif text-3xl text-fg">Teaching</h2>
            <div className="mt-3 w-10 h-px bg-accent" />
          </div>

          <div className="space-y-8">
            {TEACHING.map((position, i) => (
              <div
                key={i}
                className="sm:grid sm:grid-cols-[160px_1fr] sm:gap-8"
              >
                {/* Period */}
                <div className="mb-1 sm:mb-0">
                  <span className="font-sans text-sm text-fg-muted tracking-wide">
                    {position.period}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <p className="font-serif text-lg text-fg">
                    {position.role}
                  </p>
                  <p className="font-sans text-sm text-fg-muted mt-0.5">
                    {position.institution}
                    {position.department && (
                      <span className="text-fg-muted/70">
                        {" "}
                        — {position.department}
                      </span>
                    )}
                  </p>
                  <p className="font-sans text-xs text-fg-muted/70 mt-0.5">
                    {position.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery representation */}
        <section className="border-t border-border pt-16 mt-16">
          <div className="mb-8">
            <h2 className="font-serif text-3xl text-fg">Representation</h2>
            <div className="mt-3 w-10 h-px bg-accent" />
          </div>

          <div className="sm:grid sm:grid-cols-[160px_1fr] sm:gap-8">
            <span className="font-sans text-sm text-fg-muted tracking-wide mb-1 sm:mb-0 block">
              New York
            </span>
            <div>
              <p className="font-serif text-lg text-fg">Janet Borden Inc.</p>
              <p className="font-sans text-sm text-fg-muted mt-0.5">
                560 Broadway, Suite 601, New York, NY 10012
              </p>
              <a
                href="https://www.janetbordeninc.com"
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
