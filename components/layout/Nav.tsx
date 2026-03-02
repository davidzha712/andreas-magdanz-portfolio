"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import NavMobile from "./NavMobile";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV_KEYS = [
  { key: "work", href: "/work" },
  { key: "about", href: "/about" },
  { key: "cv", href: "/cv" },
  { key: "exhibitions", href: "/exhibitions" },
  { key: "publications", href: "/publications" },
  { key: "media", href: "/media" },
  { key: "contact", href: "/contact" },
] as const;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("nav");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={[
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          scrolled
            ? "bg-bg/90 backdrop-blur-md border-b border-border"
            : "bg-transparent",
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          {/* Logo / Name */}
          <Link
            href="/"
            className="font-serif text-base tracking-widest uppercase text-fg hover:text-accent transition-colors duration-200"
          >
            Andreas Magdanz
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {NAV_KEYS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-sans text-xs uppercase tracking-widest text-fg-muted hover:text-fg transition-colors duration-200"
              >
                {t(link.key)}
              </Link>
            ))}
            <LanguageSwitcher />
            <ThemeToggle />
          </nav>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="w-10 h-10 flex items-center justify-center text-fg-muted hover:text-fg transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <NavMobile isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
