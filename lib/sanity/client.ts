import { createClient, type SanityClient } from "next-sanity";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "b8e16q3y";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2024-01-01";

function buildClient(options: { useCdn: boolean; perspective: "published" | "previewDrafts"; token?: string }): SanityClient {
  try {
    return createClient({
      projectId,
      dataset,
      apiVersion,
      ...options,
    });
  } catch {
    // Return a stub client that throws on fetch — prevents build crashes
    return {
      fetch: async () => {
        throw new Error("Sanity client not configured");
      },
    } as unknown as SanityClient;
  }
}

export const client = buildClient({ useCdn: true, perspective: "published" });

export const previewClient = buildClient({
  useCdn: false,
  perspective: "previewDrafts",
  token: process.env.SANITY_API_READ_TOKEN,
});
