import { defineType, defineField } from "sanity";
import { ImagesIcon } from "@sanity/icons";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  icon: ImagesIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "projectImage",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "projectImage" }],
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "string",
      description: 'e.g. "2023" or "2021–2023"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      description: "Primary location where the work was created or exhibited",
    }),
    defineField({
      name: "artistStatement",
      title: "Artist Statement (DE)",
      type: "blockContent",
      description: "Artist statement specific to this project",
    }),
    defineField({
      name: "artistStatementEn",
      title: "Artist Statement (EN)",
      type: "blockContent",
      description: "English artist statement — falls back to German if empty",
    }),
    defineField({
      name: "description",
      title: "Description (DE)",
      type: "blockContent",
      description: "Detailed description of the project",
    }),
    defineField({
      name: "descriptionEn",
      title: "Description (EN)",
      type: "blockContent",
      description: "English description — falls back to German if empty",
    }),
    defineField({
      name: "isFeatured",
      title: "Featured",
      type: "boolean",
      description: "Show this project in featured sections",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Lower numbers appear first",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        defineField({
          name: "metaTitle",
          title: "Meta Title",
          type: "string",
          description: "Override the page title for search engines (max 60 characters)",
          validation: (r) => r.max(60),
        }),
        defineField({
          name: "metaDescription",
          title: "Meta Description",
          type: "text",
          rows: 3,
          description: "Description for search engines (max 160 characters)",
          validation: (r) => r.max(160),
        }),
        defineField({
          name: "ogImage",
          title: "Open Graph Image",
          type: "image",
          description: "Image used when sharing on social media (recommended: 1200×630px)",
          options: { hotspot: true },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      year: "year",
      media: "coverImage.image",
      isFeatured: "isFeatured",
    },
    prepare({ title, year, media, isFeatured }) {
      return {
        title: isFeatured ? `★ ${title}` : title,
        subtitle: year,
        media,
      };
    },
  },
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Year, Newest First",
      name: "yearDesc",
      by: [{ field: "year", direction: "desc" }],
    },
  ],
});
