import { defineType, defineField } from "sanity";
import { PlayIcon } from "@sanity/icons";

export const mediaItem = defineType({
  name: "mediaItem",
  title: "Media Item",
  type: "document",
  icon: PlayIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title (DE)",
      type: "string",
      description: "German title (default)",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "titleEn",
      title: "Title (EN)",
      type: "string",
      description: "English title — falls back to German if empty",
    }),
    defineField({
      name: "mediaType",
      title: "Media Type",
      type: "string",
      options: {
        list: [
          { title: "Audio", value: "audio" },
          { title: "Video", value: "video" },
          { title: "Press", value: "press" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "source",
      title: "Source",
      type: "string",
      description: "Publication, broadcaster, or platform name",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      options: {
        dateFormat: "YYYY-MM-DD",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "embedUrl",
      title: "Embed URL",
      type: "url",
      description: "URL for embedding (e.g. YouTube, Vimeo, SoundCloud embed link)",
      validation: (r) =>
        r.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "externalUrl",
      title: "External URL",
      type: "url",
      description: "Link to the original source",
      validation: (r) =>
        r.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      options: {
        hotspot: true,
        metadata: ["lqip", "palette"],
      },
    }),
    defineField({
      name: "pdfFile",
      title: "PDF File",
      type: "file",
      description: "Upload a PDF for inline viewing with the book viewer",
      options: {
        accept: "application/pdf",
      },
      hidden: ({ parent }) => parent?.mediaType !== "press",
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
      mediaType: "mediaType",
      source: "source",
      date: "date",
      media: "thumbnail",
    },
    prepare({ title, mediaType, source, date, media }) {
      const typeLabel =
        mediaType === "audio"
          ? "Audio"
          : mediaType === "video"
          ? "Video"
          : "Press";
      const year = date ? date.substring(0, 4) : "";
      return {
        title,
        subtitle: `${typeLabel} · ${source}${year ? ` · ${year}` : ""}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: "Date, Newest First",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
});
