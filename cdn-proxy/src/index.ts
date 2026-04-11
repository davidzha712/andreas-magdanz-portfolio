/**
 * Sanity CDN proxy — caches Sanity CDN responses at the Cloudflare edge
 * to keep the Sanity Free-plan bandwidth usage at near-zero.
 *
 * Handles two path families (both pass-through to cdn.sanity.io):
 *   /images/{projectId}/{dataset}/{asset-id}?{transform-params}
 *   /files/{projectId}/{dataset}/{asset-id}
 *
 * Everything else → 404.
 *
 * First request for a given URL: fetched from Sanity, stored in CF edge cache.
 * Subsequent requests: served from edge cache (free egress, no Sanity hit).
 *
 * Cache TTL: 1 year (images are content-addressed by hash → immutable).
 */

const SANITY_CDN_ORIGIN = "https://cdn.sanity.io";
const ONE_YEAR_SECONDS = 31_536_000;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request: Request): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);

    // Only proxy image/file paths — reject everything else
    if (
      !url.pathname.startsWith("/images/") &&
      !url.pathname.startsWith("/files/")
    ) {
      return new Response("Not found", { status: 404 });
    }

    const upstreamUrl = `${SANITY_CDN_ORIGIN}${url.pathname}${url.search}`;

    // Use upstream URL as cache key (ignores client headers, request origin, etc.)
    const cacheKey = new Request(upstreamUrl, { method: "GET" });
    const cache = caches.default;

    let response = await cache.match(cacheKey);

    if (!response) {
      // Cache miss — fetch from Sanity CDN
      const upstream = await fetch(upstreamUrl, {
        cf: {
          cacheTtl: ONE_YEAR_SECONDS,
          cacheEverything: true,
        },
      });

      if (!upstream.ok) {
        // Don't cache failures (Sanity 404s, 5xx)
        return new Response(upstream.body, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers: {
            ...CORS_HEADERS,
            "X-Cache-Status": "MISS-UPSTREAM-ERROR",
          },
        });
      }

      // Clone so we can modify headers
      const headers = new Headers(upstream.headers);
      headers.set(
        "Cache-Control",
        `public, max-age=${ONE_YEAR_SECONDS}, s-maxage=${ONE_YEAR_SECONDS}, immutable`
      );
      headers.set("X-Cache-Status", "MISS");
      headers.set("X-Cache-Via", "sanity-cdn-proxy");
      for (const [k, v] of Object.entries(CORS_HEADERS)) {
        headers.set(k, v);
      }
      // Help CDN vary correctly on Accept (Sanity uses `auto=format`)
      headers.append("Vary", "Accept");

      response = new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      });

      // Store in edge cache — clone because body is a stream
      // ctx.waitUntil would be cleaner, but ModuleWorker signature is (request, env, ctx)
      // and for our volume the perf cost is negligible.
      await cache.put(cacheKey, response.clone());
    } else {
      // Hit — clone and add marker for debugging
      const headers = new Headers(response.headers);
      headers.set("X-Cache-Status", "HIT");
      for (const [k, v] of Object.entries(CORS_HEADERS)) {
        headers.set(k, v);
      }
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};
