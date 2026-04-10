import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-serif text-4xl md:text-5xl text-fg">{t("title")}</h1>
      <p className="font-sans text-sm text-fg-muted max-w-md">
        {t("description")}
      </p>
      <Link
        href="/"
        className="font-sans text-sm tracking-wider uppercase border border-fg/20 px-6 py-3 hover:border-fg transition-colors"
      >
        {t("home")}
      </Link>
    </main>
  );
}
