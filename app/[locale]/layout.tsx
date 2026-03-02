import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { routing } from "@/i18n/routing";
import { client } from "@/lib/sanity/client";
import { siteSettingsQuery } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/types/sanity";
import "../globals.css";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  let settings: (SiteSettings & { ogImageUrl?: string }) | null = null;
  try {
    settings = await client.fetch(siteSettingsQuery, { locale });
  } catch {
    // Sanity not connected — use fallback
  }

  const title = settings?.siteTitle || "Andreas Magdanz — Photographer";
  const description =
    settings?.siteDescription ||
    "The photographic work of Andreas Magdanz — exploring landscapes, identity, and place through large-format and documentary photography.";

  return {
    title: { default: title, template: `%s — Andreas Magdanz` },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(settings?.ogImageUrl && {
        images: [{ url: settings.ogImageUrl, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: settings?.ogImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(settings?.ogImageUrl && { images: [settings.ogImageUrl] }),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${cormorantGaramond.variable} ${dmSans.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
