"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";

export default function CVDownloadButton() {
  const t = useTranslations("cv");

  return (
    <Button
      href="/cv.pdf"
      variant="primary"
      size="md"
      target="_blank"
      rel="noopener noreferrer"
      download
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {t("download")}
    </Button>
  );
}
