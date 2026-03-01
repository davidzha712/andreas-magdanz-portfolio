import { NextRequest, NextResponse } from "next/server";

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: Partial<ContactPayload>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = body;

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

  // Attempt to send via Resend if API key is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail =
    process.env.CONTACT_EMAIL ?? "studio@andreasmagdanz.de";

  if (resendApiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);

      const { error } = await resend.emails.send({
        from: "Portfolio Contact <noreply@andreasmagdanz.de>",
        to: toEmail,
        replyTo: email.trim(),
        subject: `[Contact] ${subject.trim()}`,
        text: [
          `From: ${name.trim()} <${email.trim()}>`,
          `Subject: ${subject.trim()}`,
          "",
          message.trim(),
        ].join("\n"),
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="font-size: 18px; margin-bottom: 16px; color: #0a0a0a;">
              New contact form submission
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 6px 12px 6px 0; font-size: 12px; color: #6b7280; white-space: nowrap; vertical-align: top;">From</td>
                <td style="padding: 6px 0; font-size: 14px; color: #0a0a0a;">${name.trim()} &lt;${email.trim()}&gt;</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px 6px 0; font-size: 12px; color: #6b7280; white-space: nowrap; vertical-align: top;">Subject</td>
                <td style="padding: 6px 0; font-size: 14px; color: #0a0a0a;">${subject.trim()}</td>
              </tr>
            </table>
            <div style="border-top: 1px solid #e5e5e0; padding-top: 16px;">
              <p style="font-size: 14px; color: #0a0a0a; white-space: pre-wrap; line-height: 1.6;">${message.trim()}</p>
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
    console.info(`  From: ${name.trim()} <${email.trim()}>`);
    console.info(`  Subject: ${subject.trim()}`);
    console.info(`  Message: ${message.trim()}`);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
