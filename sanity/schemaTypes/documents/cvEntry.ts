import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

const CATEGORY_OPTIONS = [
  { title: "Solo Exhibition", value: "soloExhibition" },
  { title: "Group Exhibition", value: "groupExhibition" },
  { title: "Award", value: "award" },
  { title: "Collection", value: "collection" },
  { title: "Teaching", value: "teaching" },
  { title: "Education", value: "education" },
  { title: "Publication", value: "publication" },
  { title: "Grant", value: "grant" },
];

export const cvEntry = defineType({
  name: "cvEntry",
  title: "CV Entry",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: CATEGORY_OPTIONS,
      },
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
      name: "endYear",
      title: "End Year",
      type: "number",
      description: "For ongoing or multi-year entries",
      validation: (r) =>
        r.min(1900).max(new Date().getFullYear() + 5),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "institution",
      title: "Institution / Venue",
      type: "string",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      description: "City, Country",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: "title",
      category: "category",
      year: "year",
      endYear: "endYear",
      institution: "institution",
    },
    prepare({ title, category, year, endYear, institution }) {
      const categoryLabel =
        CATEGORY_OPTIONS.find((o) => o.value === category)?.title ?? category;
      const yearRange = endYear && endYear !== year ? `${year}–${endYear}` : `${year}`;
      return {
        title,
        subtitle: `${categoryLabel} · ${yearRange}${institution ? ` · ${institution}` : ""}`,
      };
    },
  },
  orderings: [
    {
      title: "Year, Newest First",
      name: "yearDesc",
      by: [
        { field: "year", direction: "desc" },
        { field: "category", direction: "asc" },
      ],
    },
    {
      title: "Category, then Year",
      name: "categoryYear",
      by: [
        { field: "category", direction: "asc" },
        { field: "year", direction: "desc" },
      ],
    },
  ],
});
