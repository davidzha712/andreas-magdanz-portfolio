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
      name: "heroVideo",
      title: "Home Hero Video",
      type: "file",
      description:
        "Video background for the hero section (overrides image when set)",
      options: {
        accept: "video/mp4,video/webm",
      },
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
      hidden: ({ parent }) => !parent?.heroVideo,
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
      title: "Contact Email",
      type: "string",
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
