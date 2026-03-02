"use client";

import { useTranslations } from "next-intl";

export default function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border py-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans tracking-wider text-fg-muted">
        <p>{t("copyright", { year })}</p>
        <div className="flex items-center gap-6">
          <span className="text-fg-muted/60">{t("gallery")}</span>
          <a
            href="https://www.janetbordengallery.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fg transition-colors duration-200"
          >
            Janet Borden Inc.
          </a>
        </div>
      </div>
    </footer>
  );
}
