import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageAsset } from "@/types/sanity";
import { client } from "./client";

const builder = createImageUrlBuilder(client);

// Optional Cloudflare Worker that proxies cdn.sanity.io with 1-year edge cache.
// When set, every image URL produced by urlFor() is rewritten to route through
// the worker. First request per unique URL hits Sanity, subsequent requests hit
// Cloudflare's edge cache (zero egress, zero Sanity bandwidth).
const CDN_PROXY = (process.env.NEXT_PUBLIC_SANITY_CDN_PROXY ?? "").replace(
  /\/$/,
  ""
);

function rewriteCdn(url: string): string {
  if (!CDN_PROXY) return url;
  return url.replace("https://cdn.sanity.io", CDN_PROXY);
}

type ImageUrlBuilder = ReturnType<typeof builder.image>;

// Wrap the builder in a Proxy so that .url() returns a rewritten URL
// while all chain methods (width, height, auto, fit, ...) return wrapped
// builders — preserving the exact call-site ergonomics.
function wrapBuilder(b: ImageUrlBuilder): ImageUrlBuilder {
  return new Proxy(b, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === "url") {
        return function (): string {
          return rewriteCdn((value as () => string).call(target));
        };
      }

      if (typeof value === "function") {
        return function (...args: unknown[]) {
          const result = (value as (...a: unknown[]) => unknown).apply(
            target,
            args
          );
          // Chain methods return a new ImageUrlBuilder — wrap it too so the
          // rewrite propagates through the chain.
          if (
            result &&
            typeof result === "object" &&
            "url" in result &&
            typeof (result as { url: unknown }).url === "function"
          ) {
            return wrapBuilder(result as ImageUrlBuilder);
          }
          return result;
        };
      }

      return value;
    },
  }) as ImageUrlBuilder;
}

export function urlFor(source: SanityImageAsset) {
  return wrapBuilder(builder.image(source));
}
