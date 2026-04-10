import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string; // honeypot
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Escape HTML special characters to prevent injection in the email HTML body
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Rate limiting
//
// Prefer Upstash Redis (works across Vercel's multi-region serverless). When
// the Upstash env vars are missing, fall back to an in-memory limiter so that
// local development and preview deployments continue to work without manual
// configuration.
// ---------------------------------------------------------------------------

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const upstashRatelimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, "10 m"),
      analytics: true,
      prefix: "ratelimit:contact",
    })
  : null;

if (!hasUpstash && process.env.NODE_ENV === "production") {
  console.warn(
    "[contact] UPSTASH_REDIS_REST_URL not set — falling back to in-memory rate limiter. Not recommended for production."
  );
}

const IN_MEMORY_WINDOW_MS = 10 * 60 * 1000;
const IN_MEMORY_LIMIT = 3;
const inMemoryHits = new Map<string, number[]>();

async function checkRateLimit(ip: string): Promise<{ allowed: boolean }> {
  if (upstashRatelimit) {
    const { success } = await upstashRatelimit.limit(ip);
    return { allowed: success };
  }

  const now = Date.now();
  const hits = (inMemoryHits.get(ip) ?? []).filter(
    (t) => now - t < IN_MEMORY_WINDOW_MS
  );
  if (hits.length >= IN_MEMORY_LIMIT) {
    return { allowed: false };
  }
  inMemoryHits.set(ip, [...hits, now]);

  // Opportunistic cleanup to prevent unbounded growth
  if (inMemoryHits.size > 5000) {
    inMemoryHits.forEach((times, key) => {
      const kept = times.filter((t) => now - t < IN_MEMORY_WINDOW_MS);
      if (kept.length === 0) {
        inMemoryHits.delete(key);
      } else {
        inMemoryHits.set(key, kept);
      }
    });
  }

  return { allowed: true };
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  // Origin check — reject cross-origin requests
  const origin = request.headers.get("origin");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const host = request.headers.get("host");
  const expectedOrigins = new Set<string>();
  if (siteUrl) expectedOrigins.add(siteUrl.replace(/\/$/, ""));
  if (host) {
    expectedOrigins.add(`https://${host}`);
    expectedOrigins.add(`http://${host}`);
  }

  if (origin && expectedOrigins.size > 0 && !expectedOrigins.has(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit per IP (Upstash with in-memory fallback)
  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: Partial<ContactPayload>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { name, email, subject, message, website } = body;

  // Honeypot — silently succeed to avoid tipping off bots
  if (typeof website === "string" && website.trim() !== "") {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Validate required fields
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  const trimmedEmail = email.trim();

  // Reject header-injection attempts in the replyTo address
  if (/[\r\n]/.test(trimmedEmail)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  const trimmedName = name.trim();
  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();

  // Attempt to send via Resend if API key is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL ?? "studio@andreasmagdanz.de";

  if (resendApiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);

      const safeName = escapeHtml(trimmedName);
      const safeEmail = escapeHtml(trimmedEmail);
      const safeSubject = escapeHtml(trimmedSubject);
      const safeMessage = escapeHtml(trimmedMessage);

      const { error } = await resend.emails.send({
        from: "Portfolio Contact <noreply@andreasmagdanz.de>",
        to: toEmail,
        replyTo: trimmedEmail,
        subject: `[Contact] ${trimmedSubject}`,
        text: [
          `From: ${trimmedName} <${trimmedEmail}>`,
          `Subject: ${trimmedSubject}`,
          "",
          trimmedMessage,
        ].join("\n"),
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="font-size: 18px; margin-bottom: 16px; color: #0a0a0a;">
              New contact form submission
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 6px 12px 6px 0; font-size: 12px; color: #6b7280; white-space: nowrap; vertical-align: top;">From</td>
                <td style="padding: 6px 0; font-size: 14px; color: #0a0a0a;">${safeName} &lt;${safeEmail}&gt;</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px 6px 0; font-size: 12px; color: #6b7280; white-space: nowrap; vertical-align: top;">Subject</td>
                <td style="padding: 6px 0; font-size: 14px; color: #0a0a0a;">${safeSubject}</td>
              </tr>
            </table>
            <div style="border-top: 1px solid #e5e5e0; padding-top: 16px;">
              <p style="font-size: 14px; color: #0a0a0a; white-space: pre-wrap; line-height: 1.6;">${safeMessage}</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("[contact route] Resend error:", error);
        // Still return success to the user — email delivery is best-effort
      }
    } catch (err) {
      console.error("[contact route] Failed to send via Resend:", err);
      // Fall through — return success in placeholder mode
    }
  } else {
    // Placeholder mode: log to server console
    console.info("[contact route] RESEND_API_KEY not set — placeholder mode");
    console.info(`  From: ${trimmedName} <${trimmedEmail}>`);
    console.info(`  Subject: ${trimmedSubject}`);
    console.info(`  Message: ${trimmedMessage}`);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
