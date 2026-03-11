import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const LOCALES = ["de", "en"];

function revalidateLocalized(path: string) {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}${path}`, "page");
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;

  // Verify secret if configured
  if (secret) {
    const authHeader = request.headers.get("authorization");
    const querySecret = request.nextUrl.searchParams.get("secret");
    const providedSecret = authHeader?.replace("Bearer ", "") ?? querySecret;

    if (providedSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: { _type?: string; slug?: { current?: string } } = {};

  try {
    body = await request.json();
  } catch {
    // Body is optional — still revalidate all
  }

  try {
    const documentType = body?._type;
    const slug = body?.slug?.current;

    switch (documentType) {
      case "project":
        revalidateLocalized("/work");
        if (slug) {
          revalidateLocalized(`/work/${slug}`);
        }
        break;

      case "exhibition":
        revalidateLocalized("/exhibitions");
        break;

      case "publication":
        revalidateLocalized("/publications");
        break;

      case "mediaItem":
        revalidateLocalized("/media");
        break;

      case "cvEntry":
        revalidateLocalized("/cv");
        break;

      case "siteSettings":
        for (const locale of LOCALES) {
          revalidatePath(`/${locale}`, "page");
        }
        break;

      default:
        // Revalidate root layout (covers all localized paths)
        revalidatePath("/", "layout");
        break;
    }

    return NextResponse.json(
      {
        revalidated: true,
        documentType: documentType ?? "all",
        slug: slug ?? null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[revalidate route] Error:", err);
    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 }
    );
  }
}
