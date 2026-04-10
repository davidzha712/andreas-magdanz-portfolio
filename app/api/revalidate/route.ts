import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { parseBody } from "next-sanity/webhook";

export const runtime = "nodejs";

const LOCALES = ["de", "en"];

interface SanityWebhookBody {
  _type: string;
  slug?: { current?: string };
}

function revalidateLocalized(path: string) {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}${path}`, "page");
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;

  if (!secret) {
    console.error(
      "[revalidate route] SANITY_REVALIDATE_SECRET is not configured"
    );
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 }
    );
  }

  let body: SanityWebhookBody | null = null;

  try {
    const parsed = await parseBody<SanityWebhookBody>(request, secret);

    if (!parsed.isValidSignature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    body = parsed.body;
  } catch (err) {
    console.error("[revalidate route] Failed to parse webhook body:", err);
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 }
    );
  }

  try {
    const documentType = body?._type;
    const slug = body?.slug?.current;

    let revalidated = true;

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
        // Unknown document type — do not mass-revalidate
        revalidated = false;
        break;
    }

    return NextResponse.json(
      {
        revalidated,
        documentType: documentType ?? null,
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
