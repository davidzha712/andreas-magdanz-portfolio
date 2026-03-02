import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Andreas Magdanz — Photographer",
  description:
    "The photographic work of Andreas Magdanz — exploring landscapes, identity, and place through large-format and documentary photography.",
  openGraph: {
    title: "Andreas Magdanz — Photographer",
    description:
      "The photographic work of Andreas Magdanz — exploring landscapes, identity, and place through large-format and documentary photography.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // html/body are rendered in app/[locale]/layout.tsx with the correct lang attribute
  return children;
}
