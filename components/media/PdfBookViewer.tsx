"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
} from "react";
import { pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfBookViewerProps {
  pdfUrl: string;
  title: string;
  source?: string;
  date?: string;
  translations: {
    loading: string;
    error: string;
    pageOf: string;
    pageTotal: string;
    downloadPdf: string;
  };
}

/* ── Canvas-rendered cover / back cover ── */

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function renderCover(
  w: number,
  h: number,
  title: string,
  source?: string,
  date?: string
): string {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // Background
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, w, h);

  // Subtle inner border
  const inset = w * 0.08;
  ctx.strokeStyle = "rgba(196,168,130,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  // Top accent line
  const lineW = w * 0.2;
  const topY = h * 0.28;
  ctx.strokeStyle = "#c4a882";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo((w - lineW) / 2, topY);
  ctx.lineTo((w + lineW) / 2, topY);
  ctx.stroke();

  ctx.textAlign = "center";

  // Source label (above title)
  if (source) {
    const srcSize = Math.max(12, Math.round(w * 0.026));
    ctx.font = `${srcSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#c4a882";
    ctx.letterSpacing = "3px";
    ctx.fillText(source.toUpperCase(), w / 2, topY + srcSize * 2.5);
    ctx.letterSpacing = "0px";
  }

  // Title
  const titleSize = Math.max(16, Math.round(w * 0.052));
  ctx.font = `${titleSize}px Georgia, "Times New Roman", "Noto Serif", serif`;
  ctx.fillStyle = "#f5f5f0";
  const titleLines = wrapText(ctx, title, w * 0.7);
  const lineH = titleSize * 1.5;
  const titleY = h * 0.48 - (titleLines.length * lineH) / 2;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, w / 2, titleY + i * lineH);
  });

  // Date
  if (date) {
    const dateSize = Math.max(11, Math.round(w * 0.022));
    ctx.font = `${dateSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#6b7280";
    ctx.fillText(date, w / 2, h * 0.65);
  }

  // Bottom accent line
  const botY = h * 0.72;
  ctx.strokeStyle = "#c4a882";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo((w - lineW) / 2, botY);
  ctx.lineTo((w + lineW) / 2, botY);
  ctx.stroke();

  // "PRESS" label at bottom
  const pressSize = Math.max(9, Math.round(w * 0.018));
  ctx.font = `${pressSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "rgba(156,163,175,0.4)";
  ctx.letterSpacing = "4px";
  ctx.fillText("PRESS", w / 2, h * 0.88);
  ctx.letterSpacing = "0px";

  return c.toDataURL("image/jpeg", 0.95);
}

function renderBackCover(w: number, h: number): string {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // Background
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, w, h);

  // Subtle inner border
  const inset = w * 0.08;
  ctx.strokeStyle = "rgba(196,168,130,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  ctx.textAlign = "center";

  // Center dot
  ctx.fillStyle = "#c4a882";
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.47, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Name
  const nameSize = Math.max(10, Math.round(w * 0.022));
  ctx.font = `${nameSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = "rgba(156,163,175,0.35)";
  ctx.letterSpacing = "3px";
  ctx.fillText("ANDREAS MAGDANZ", w / 2, h * 0.53);
  ctx.letterSpacing = "0px";

  return c.toDataURL("image/jpeg", 0.95);
}

/* ── A single book page — just an <img>, no react-pdf dependency ── */
const BookPage = forwardRef<
  HTMLDivElement,
  { src: string; number: number; isCover?: boolean }
>(function BookPage({ src, number, isCover }, ref) {
  return (
    <div ref={ref} className={`pdf-page${isCover ? " pdf-cover" : ""}`}>
      <img
        src={src}
        alt={`Page ${number}`}
        draggable={false}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
});

/* ── Main Book Viewer ── */
export default function PdfBookViewer({
  pdfUrl,
  title,
  source,
  date,
  translations: t,
}: PdfBookViewerProps) {
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageAspect, setPageAspect] = useState(1.414);
  const [currentPage, setCurrentPage] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Reduced motion ── */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* ── Responsive sizing ── */
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ── Load PDF and render all pages to images ── */
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        const pdf = await pdfjs.getDocument(pdfUrl).promise;
        const numPages = pdf.numPages;
        const contentImages: string[] = [];
        let coverW = 0;
        let coverH = 0;

        for (let i = 1; i <= numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);

          // Detect aspect ratio and dimensions from first page
          if (i === 1) {
            const vp = page.getViewport({ scale: 1 });
            setPageAspect(vp.height / vp.width);
            coverW = Math.round(vp.width * 2);
            coverH = Math.round(vp.height * 2);
          }

          // Render at 2x for clarity
          const scale = 2;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;

          contentImages.push(canvas.toDataURL("image/jpeg", 0.92));
          setLoadProgress(Math.round((i / numPages) * 100));
        }

        if (!cancelled) {
          // Generate cover and back cover at the same dimensions
          const cover = renderCover(coverW, coverH, title, source, date);
          const back = renderBackCover(coverW, coverH);

          setPdfPageCount(numPages);
          setPageImages([cover, ...contentImages, back]);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("PDF load error:", err);
          setError(t.error);
          setIsLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, title, source, date, t.error]);

  /* ── Keyboard nav ── */
  const handleKey = useCallback((e: KeyboardEvent) => {
    const fb = bookRef.current?.pageFlip();
    if (!fb) return;
    if (e.key === "ArrowRight") fb.flipNext();
    if (e.key === "ArrowLeft") fb.flipPrev();
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  /* ── Computed dims ── */
  const isMobile = containerWidth < 640;
  const pageWidth = isMobile
    ? Math.max(240, Math.min(containerWidth - 32, 420))
    : Math.max(240, Math.min((containerWidth - 48) / 2, 480));
  const pageHeight = Math.round(pageWidth * pageAspect);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFlip = (e: any) => setCurrentPage(e.data);

  // Page label: cover = title, content = "Page X of Y", back cover = empty
  const isCoverPage = currentPage === 0;
  const isBackCover = currentPage >= pageImages.length - 1;
  const contentPageNum = currentPage; // cover is 0, first content is 1
  const pageLabel = isCoverPage
    ? source || title
    : isBackCover
      ? ""
      : `${t.pageOf} ${contentPageNum} ${t.pageTotal} ${pdfPageCount}`;

  return (
    <div ref={containerRef} className="pdf-book-container">
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="font-sans text-sm text-fg-muted">{t.loading}</p>
          {loadProgress > 0 && (
            <div className="w-48 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="font-sans text-sm text-fg-muted">{error}</p>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm text-accent underline underline-offset-2 hover:text-accent-hover transition-colors"
          >
            {t.downloadPdf}
          </a>
        </div>
      )}

      {/* Book viewer — only when all pages are rendered */}
      {pageImages.length > 0 && !error && containerWidth > 0 && (
        <>
          <div className="flex justify-center">
            <HTMLFlipBook
              ref={bookRef}
              width={pageWidth}
              height={pageHeight}
              size="stretch"
              minWidth={240}
              maxWidth={480}
              minHeight={340}
              maxHeight={Math.round(480 * pageAspect)}
              showCover={true}
              mobileScrollSupport={false}
              onFlip={onFlip}
              flippingTime={prefersReducedMotion ? 0 : 800}
              usePortrait={isMobile}
              startPage={0}
              drawShadow={true}
              maxShadowOpacity={0.3}
              className="pdf-book"
              style={{}}
              startZIndex={0}
              autoSize={true}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
            >
              {pageImages.map((src, i) => (
                <BookPage
                  key={i}
                  src={src}
                  number={i + 1}
                  isCover={i === 0 || i === pageImages.length - 1}
                />
              ))}
            </HTMLFlipBook>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={() => bookRef.current?.pageFlip().flipPrev()}
              disabled={currentPage === 0}
              className="w-10 h-10 flex items-center justify-center text-fg-muted hover:text-fg disabled:opacity-30 transition-colors"
              aria-label="Previous page"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <span
              className="font-sans text-xs text-fg-muted tracking-wider min-w-[100px] text-center"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {pageLabel}
            </span>

            <button
              onClick={() => bookRef.current?.pageFlip().flipNext()}
              disabled={currentPage >= pageImages.length - 1}
              className="w-10 h-10 flex items-center justify-center text-fg-muted hover:text-fg disabled:opacity-30 transition-colors"
              aria-label="Next page"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Download link */}
          <div className="flex justify-center mt-4">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs text-fg-muted hover:text-accent transition-colors tracking-wide flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t.downloadPdf}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
