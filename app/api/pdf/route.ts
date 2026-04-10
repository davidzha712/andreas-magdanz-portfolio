import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only proxy PDFs from our own Sanity project to prevent open-proxy abuse
const ALLOWED_PREFIX = "https://cdn.sanity.io/files/b8e16q3y/";
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  if (!url.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, { cache: "force-cache" });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: upstream.status }
      );
    }

    // Validate content-type: only accept application/pdf
    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/pdf")) {
      return NextResponse.json(
        { error: "Unsupported media type" },
        { status: 415 }
      );
    }

    // Enforce size limit based on upstream content-length header
    const contentLengthHeader = upstream.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (Number.isFinite(contentLength) && contentLength > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Payload too large" },
          { status: 413 }
        );
      }
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
  }
}
