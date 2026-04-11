import { defineType, defineField } from "sanity";
import { CogIcon } from "@sanity/icons";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({
      name: "siteTitle",
      title: "Site Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "siteDescription",
      title: "Site Description (DE)",
      type: "text",
      rows: 3,
      description: "Default meta description for the site",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "siteDescriptionEn",
      title: "Site Description (EN)",
      type: "text",
      rows: 3,
      description: "English meta description — falls back to German if empty",
    }),
    defineField({
      name: "homeHeroProject",
      title: "Home Hero Project",
      type: "reference",
      to: [{ type: "project" }],
      description: "Project displayed as the hero on the homepage",
    }),
    defineField({
      name: "heroImage",
      title: "Home Hero Image",
      type: "image",
      description:
        "Portrait or image displayed as the hero when no project is selected",
      options: { hotspot: true },
    }),
    defineField({
      name: "heroVideos",
      title: "Home Hero Videos",
      type: "array",
      of: [
        {
          name: "heroVideo",
          title: "Hero Video",
          type: "file",
          options: {
            accept: "video/mp4,video/webm",
          },
        },
      ],
      description:
        "Multiple video backgrounds for the hero section. One will be randomly selected on each refresh.",
    }),
    defineField({
      name: "heroVideoPosition",
      title: "Hero Video Focus Position",
      type: "string",
      description: "Where to anchor the video when cropped to fit the screen",
      options: {
        list: [
          { title: "Top", value: "top" },
          { title: "Center", value: "center" },
          { title: "Bottom", value: "bottom" },
          { title: "Left", value: "left" },
          { title: "Right", value: "right" },
        ],
        layout: "radio",
      },
      initialValue: "center",
      hidden: ({ parent }) => !parent?.heroVideos || parent.heroVideos.length === 0,
    }),
    defineField({
      name: "ogImage",
      title: "Default Open Graph Image",
      type: "image",
      description: "Fallback image used when sharing the site on social media",
      options: { hotspot: true },
    }),
    defineField({
      name: "galleryName",
      title: "Gallery Name",
      type: "string",
    }),
    defineField({
      name: "galleryUrl",
      title: "Gallery Website URL",
      type: "url",
      validation: (r) =>
        r.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "galleryEmail",
      title: "Gallery Email",
      type: "string",
    }),
    defineField({
      name: "contactEmail",
      title: "Contact Email (Empfänger des Kontaktformulars)",
      type: "string",
      description:
        "Empfängeradresse für Nachrichten aus dem Kontaktformular. Wird sofort wirksam (kein Deploy nötig). Muss eine bei Resend verifizierte Domain verwenden oder eine Adresse auf einer verifizierten Domain sein.",
      validation: (r) =>
        r.custom((value) => {
          if (!value) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? true
            : "Ungültige E-Mail-Adresse";
        }),
    }),
    defineField({
      name: "contactAddress",
      title: "Contact Address",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "contactPhone",
      title: "Contact Phone",
      type: "string",
    }),
    defineField({
      name: "universityInfo",
      title: "University / Academic Affiliation (DE)",
      type: "text",
      rows: 3,
      description: "University position or academic affiliation details",
    }),
    defineField({
      name: "universityInfoEn",
      title: "University / Academic Affiliation (EN)",
      type: "text",
      rows: 3,
      description: "English university info — falls back to German if empty",
    }),
    defineField({
      name: "artistBio",
      title: "Artist Biography (DE)",
      type: "array",
      of: [{ type: "block" }],
      description: "Full biography text displayed on the About page",
    }),
    defineField({
      name: "artistBioEn",
      title: "Artist Biography (EN)",
      type: "array",
      of: [{ type: "block" }],
      description: "English biography — falls back to German if empty",
    }),
    defineField({
      name: "artistPortrait",
      title: "Artist Portrait",
      type: "image",
      options: { hotspot: true },
      description: "Portrait photo displayed on the About page",
    }),
    defineField({
      name: "teachingHistory",
      title: "Teaching History (DE)",
      type: "array",
      of: [{ type: "block" }],
      description: "Teaching positions and academic history",
    }),
    defineField({
      name: "teachingHistoryEn",
      title: "Teaching History (EN)",
      type: "array",
      of: [{ type: "block" }],
      description: "English teaching history — falls back to German if empty",
    }),
    defineField({
      name: "galleryAddress",
      title: "Gallery Address",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "universityAddress",
      title: "University Address",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "legalInfo",
      title: "Rechtliche Angaben (Impressum / Datenschutz)",
      type: "object",
      description:
        "Personenbezogene Daten für Impressum und Datenschutzerklärung. Erst NACH juristischer Prüfung 'Veröffentlicht' aktivieren — dies entfernt den Entwurfs-Hinweis und gibt die Seiten für Suchmaschinen frei.",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: "legalName",
          title: "Name / Firma",
          type: "string",
          description: "Vollständiger Name (Vorname Nachname) oder Firmenname",
        }),
        defineField({
          name: "street",
          title: "Straße und Hausnummer",
          type: "string",
        }),
        defineField({
          name: "postalCode",
          title: "PLZ",
          type: "string",
        }),
        defineField({
          name: "city",
          title: "Stadt",
          type: "string",
        }),
        defineField({
          name: "country",
          title: "Land",
          type: "string",
          initialValue: "Deutschland",
        }),
        defineField({
          name: "phone",
          title: "Telefon",
          type: "string",
        }),
        defineField({
          name: "email",
          title: "E-Mail",
          type: "string",
          validation: (r) =>
            r.custom((value) => {
              if (!value) return true;
              return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ? true
                : "Ungültige E-Mail-Adresse";
            }),
        }),
        defineField({
          name: "vatId",
          title: "Umsatzsteuer-ID (oder § 19 UStG Hinweis)",
          type: "string",
          description:
            "Z. B. 'DE123456789' oder 'Kleinunternehmer gemäß § 19 UStG, daher keine USt-ID'",
        }),
        defineField({
          name: "responsibleName",
          title: "Verantwortlich für den Inhalt (§ 55 RStV) — Name",
          type: "string",
          description:
            "Leer lassen, um denselben Namen wie oben zu verwenden",
        }),
        defineField({
          name: "responsibleAddress",
          title: "Verantwortlich für den Inhalt — Anschrift",
          type: "string",
          description:
            "Leer lassen, um dieselbe Anschrift wie oben zu verwenden",
        }),
        defineField({
          name: "supervisoryAuthority",
          title: "Datenschutz-Aufsichtsbehörde",
          type: "string",
          description:
            "Z. B. 'Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LfDI NRW), Kavalleriestraße 2-4, 40213 Düsseldorf'. Leer = LfDI NRW Default.",
        }),
        defineField({
          name: "published",
          title: "Veröffentlicht (nach juristischer Prüfung)",
          type: "boolean",
          description:
            "NUR aktivieren, wenn alle Pflichtfelder ausgefüllt UND ein Anwalt den Text geprüft hat. Aktivierung entfernt den 'Entwurf'-Banner und gibt die Seiten für Google frei (entfernt noindex).",
          initialValue: false,
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "siteTitle",
      media: "ogImage",
    },
    prepare({ title, media }) {
      return {
        title: title ?? "Site Settings",
        media,
      };
    },
  },
});
