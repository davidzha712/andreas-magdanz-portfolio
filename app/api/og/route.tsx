import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const title = searchParams.get("title") ?? "Andreas Magdanz";
  const subtitle = searchParams.get("subtitle") ?? "Photography";

  // Clamp lengths for visual safety
  const displayTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
  const displaySubtitle =
    subtitle.length > 80 ? subtitle.slice(0, 77) + "..." : subtitle;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "64px 72px",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Accent line top-left */}
        <div
          style={{
            position: "absolute",
            top: 64,
            left: 72,
            width: 48,
            height: 1,
            background: "#c4a882",
          }}
        />

        {/* Photographer name — always shown when title differs */}
        {displayTitle !== "Andreas Magdanz" && (
          <p
            style={{
              fontFamily: "serif",
              fontSize: 18,
              color: "#c4a882",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: "0 0 24px 0",
            }}
          >
            Andreas Magdanz
          </p>
        )}

        {/* Main title */}
        <h1
          style={{
            fontFamily: "serif",
            fontSize: displayTitle.length > 30 ? 56 : 72,
            fontWeight: 400,
            color: "#f5f5f0",
            lineHeight: 1.1,
            margin: "0 0 20px 0",
            maxWidth: "900px",
          }}
        >
          {displayTitle}
        </h1>

        {/* Subtitle */}
        {displaySubtitle && (
          <p
            style={{
              fontFamily: "sans-serif",
              fontSize: 20,
              color: "#9ca3af",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {displaySubtitle}
          </p>
        )}

        {/* Bottom-right watermark */}
        <p
          style={{
            position: "absolute",
            bottom: 48,
            right: 72,
            fontFamily: "sans-serif",
            fontSize: 14,
            color: "#2a2a2a",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          andreasmagdanz.de
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
