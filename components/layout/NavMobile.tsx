"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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

interface NavMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavMobile({ isOpen, onClose }: NavMobileProps) {
  const t = useTranslations("nav");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          className="fixed inset-0 z-50 bg-bg flex flex-col"
        >
          {/* Header row */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <Link
              href="/"
              onClick={onClose}
              className="font-serif text-lg tracking-widest uppercase text-fg"
            >
              Andreas Magdanz
            </Link>
            <button
              onClick={onClose}
              aria-label="Close menu"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 flex flex-col items-center justify-center gap-8">
            {NAV_KEYS.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
              >
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="font-serif text-3xl sm:text-4xl tracking-widest uppercase text-fg hover:text-accent transition-colors duration-200"
                >
                  {t(link.key)}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Footer row */}
          <div className="px-6 py-5 border-t border-border flex items-center justify-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
