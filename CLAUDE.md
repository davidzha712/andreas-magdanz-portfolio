# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio website for photographer Andreas Magdanz. Built with Next.js 16 (App Router), Sanity CMS, and deployed on Vercel.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run tests (node --test lib/search/searchUtils.test.ts)
```

## Architecture

### Routing & i18n

- **Bilingual**: German (`de`, default) and English (`en`) via `next-intl`
- Locale prefix is always shown (`/de/...`, `/en/...`)
- `middleware.ts` handles locale routing; excludes `/api`, `/studio`, and static files
- i18n config lives in `i18n/` — routing, config, request handler
- Translation strings in `messages/de.json` and `messages/en.json`
- Content translations use a field-level pattern: Sanity stores both `field` (German) and `fieldEn` (English), resolved via GROQ `select($locale == "en" => coalesce(fieldEn, field), field)`

### Layout Hierarchy

```
app/layout.tsx                         # Passthrough (no html/body)
  app/[locale]/layout.tsx              # html/body, fonts, ThemeProvider, NextIntlClientProvider
    app/[locale]/(site)/layout.tsx     # Nav + Footer + PageTransition wrapper
    app/(studio)/...                   # Sanity Studio (no site chrome)
```

### Sanity CMS

- **Project ID**: `b8e16q3y`, dataset: `production`
- **Studio**: embedded at `/studio` via `next-sanity`
- **Schema types**: project, exhibition, publication, mediaItem, cvEntry, siteSettings (+ objects: projectImage, blockContent)
- **Queries**: all GROQ queries in `lib/sanity/queries.ts`
- **Revalidation**: webhook endpoint at `POST /api/revalidate` — type-aware path revalidation, secured by `SANITY_REVALIDATE_SECRET`
- **Image URLs**: `lib/sanity/image.ts` using `@sanity/image-url`

### API Routes

- `POST /api/contact` — contact form, sends email via Resend (falls back to console logging without `RESEND_API_KEY`)
- `POST /api/revalidate` — Sanity webhook for on-demand ISR
- `GET /api/pdf` — PDF proxy

### Key Libraries

- **GSAP** + `@gsap/react` — scroll animations, page transitions (`lib/gsap/`)
- **Framer Motion** — page transitions (`PageTransition` component)
- **next-themes** — dark/light mode (default: dark)
- **react-pdf** + **react-pageflip** — PDF flip-book viewer for press articles
- **Tailwind CSS v4** — styling (via `@tailwindcss/postcss`)

### Fonts

- `Cormorant Garamond` (serif, `--font-cormorant`) — headings
- `DM Sans` (sans, `--font-dm-sans`) — body text

### Environment Variables

- `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` — Sanity connection
- `SANITY_REVALIDATE_SECRET` — webhook auth
- `RESEND_API_KEY` — email sending
- `CONTACT_EMAIL` — recipient for contact form

### Seed Scripts

The `seed/` directory contains one-off data migration and content seeding scripts for Sanity (not part of the app runtime). They have their own `package.json`.
