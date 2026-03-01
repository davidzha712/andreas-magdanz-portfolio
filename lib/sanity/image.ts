import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageAsset } from "@/types/sanity";
import { client } from "./client";

const builder = createImageUrlBuilder(client);

export function urlFor(source: SanityImageAsset) {
  return builder.image(source);
}
