import { defineType, defineField } from "sanity";
import { ImageIcon } from "@sanity/icons";

export const projectImage = defineType({
  name: "projectImage",
  title: "Project Image",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
        metadata: ["lqip", "palette"],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "alt",
      title: "Alt Text",
      type: "string",
      description: "Describe the image for screen readers and SEO",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description: "Optional caption displayed below the image",
    }),
  ],
  preview: {
    select: {
      title: "alt",
      media: "image",
    },
  },
});
