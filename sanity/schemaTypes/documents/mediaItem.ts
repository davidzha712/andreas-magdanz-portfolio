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
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
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
      name: "description",
      title: "Description",
      type: "blockContent",
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
