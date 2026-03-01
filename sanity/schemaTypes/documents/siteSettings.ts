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
      title: "Site Description",
      type: "text",
      rows: 3,
      description: "Default meta description for the site",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "homeHeroProject",
      title: "Home Hero Project",
      type: "reference",
      to: [{ type: "project" }],
      description: "Project displayed as the hero on the homepage",
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
      title: "University / Academic Affiliation",
      type: "text",
      rows: 3,
      description: "University position or academic affiliation details",
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
