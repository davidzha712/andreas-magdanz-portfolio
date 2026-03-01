import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

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

    // Revalidate by document type
    switch (documentType) {
      case "project":
        revalidateTag("project", "default");
        revalidatePath("/work", "page");
        if (slug) {
          revalidatePath(`/work/${slug}`, "page");
        }
        break;

      case "exhibition":
        revalidateTag("exhibition", "default");
        revalidatePath("/exhibitions", "page");
        break;

      case "publication":
        revalidateTag("publication", "default");
        revalidatePath("/publications", "page");
        break;

      case "mediaItem":
        revalidateTag("mediaItem", "default");
        revalidatePath("/media", "page");
        break;

      case "cvEntry":
        revalidateTag("cvEntry", "default");
        revalidatePath("/cv", "page");
        break;

      case "siteSettings":
        revalidateTag("siteSettings", "default");
        revalidatePath("/", "page");
        break;

      default:
        // Revalidate all known paths
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
