import { defineType, defineField } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export const exhibition = defineType({
  name: "exhibition",
  title: "Exhibition",
  type: "document",
  icon: CalendarIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "type",
      title: "Exhibition Type",
      type: "string",
      options: {
        list: [
          { title: "Solo", value: "solo" },
          { title: "Group", value: "group" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "venue",
      title: "Venue",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "country",
      title: "Country (DE)",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "countryEn",
      title: "Country (EN)",
      type: "string",
      description: "English country name — falls back to German if empty",
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
      name: "endYear",
      title: "End Year",
      type: "number",
      description: "If the exhibition spanned multiple years",
      validation: (r) =>
        r.min(1900).max(new Date().getFullYear() + 5),
    }),
    defineField({
      name: "venueImage",
      title: "Venue Image",
      type: "image",
      options: {
        hotspot: true,
        metadata: ["lqip", "palette"],
      },
    }),
    defineField({
      name: "relatedProject",
      title: "Related Project",
      type: "reference",
      to: [{ type: "project" }],
      description: "Link to the project featured in this exhibition",
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
      year: "year",
      endYear: "endYear",
      venue: "venue",
      city: "city",
      type: "type",
      media: "venueImage",
    },
    prepare({ title, year, endYear, venue, city, type }) {
      const yearRange = endYear && endYear !== year ? `${year}–${endYear}` : `${year}`;
      const typeLabel = type === "solo" ? "Solo" : "Group";
      return {
        title,
        subtitle: `${typeLabel} · ${yearRange} · ${venue}, ${city}`,
      };
    },
  },
  orderings: [
    {
      title: "Year, Newest First",
      name: "yearDesc",
      by: [{ field: "year", direction: "desc" }],
    },
    {
      title: "Year, Oldest First",
      name: "yearAsc",
      by: [{ field: "year", direction: "asc" }],
    },
  ],
});
