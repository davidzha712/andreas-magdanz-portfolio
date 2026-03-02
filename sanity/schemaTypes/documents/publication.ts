import { defineType, defineField } from "sanity";
import { BookIcon } from "@sanity/icons";

export const publication = defineType({
  name: "publication",
  title: "Publication",
  type: "document",
  icon: BookIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "publisher",
      title: "Publisher",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      validation: (r) =>
        r
          .required()
          .min(1900)
          .max(new Date().getFullYear() + 5),
    }),
    defineField({
      name: "isbn",
      title: "ISBN",
      type: "string",
      description: "International Standard Book Number",
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: {
        hotspot: true,
        metadata: ["lqip", "palette"],
      },
    }),
    defineField({
      name: "purchaseUrl",
      title: "Purchase URL",
      type: "url",
      description: "Link to purchase or view this publication",
      validation: (r) =>
        r.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "description",
      title: "Description (DE)",
      type: "blockContent",
    }),
    defineField({
      name: "descriptionEn",
      title: "Description (EN)",
      type: "blockContent",
      description: "English description — falls back to German if empty",
    }),
  ],
  preview: {
    select: {
      title: "title",
      publisher: "publisher",
      year: "year",
      media: "coverImage",
    },
    prepare({ title, publisher, year, media }) {
      return {
        title,
        subtitle: `${publisher} · ${year}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: "Year, Newest First",
      name: "yearDesc",
      by: [{ field: "year", direction: "desc" }],
    },
  ],
});
