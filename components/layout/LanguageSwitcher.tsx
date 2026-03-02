"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(newLocale: string) {
    // Replace the locale prefix in the current path
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");

    startTransition(() => {
      router.replace(newPath);
    });
  }

  const otherLocale = locale === "de" ? "en" : "de";

  return (
    <button
      onClick={() => switchLocale(otherLocale)}
      disabled={isPending}
      className="font-sans text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors duration-200 disabled:opacity-50"
      title={otherLocale === "en" ? "Switch to English" : "Auf Deutsch wechseln"}
    >
      {otherLocale.toUpperCase()}
    </button>
  );
}
