"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import type { Locale } from "@/i18n/config";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const otherLocale: Locale = locale === "de" ? "en" : "de";

  function switchLocale() {
    startTransition(() => {
      router.replace(pathname, { locale: otherLocale });
    });
  }

  return (
    <button
      onClick={switchLocale}
      disabled={isPending}
      className="font-sans text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors duration-200 disabled:opacity-50"
      title={otherLocale === "en" ? "Switch to English" : "Auf Deutsch wechseln"}
    >
      {otherLocale.toUpperCase()}
    </button>
  );
}
