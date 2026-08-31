import "server-only";
import { site } from "@/lib/site";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendOtpEmail(to: string, code: string, ttlMinutes: number) {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !sender) {
    // Dev fallback so the flow is testable before Brevo is configured.
    const missing = [
      !apiKey && "BREVO_API_KEY",
      !sender && "BREVO_SENDER_EMAIL",
    ]
      .filter(Boolean)
      .join(", ");
    console.warn(`[brevo] ${missing} not set — OTP for ${to} is: ${code}`);
    return { ok: true as const, devFallback: true };
  }

  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: site.name, email: sender },
      to: [{ email: to }],
      subject: `${code} is your ${site.name} verification code`,
      htmlContent: `
        <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fdf9f2;border-radius:12px;color:#3d2c1e">
          <h1 style="font-size:22px;margin:0 0 4px">${site.name}</h1>
          <p style="margin:0 0 24px;color:#8a6d55">${site.tagline}</p>
          <p style="font-size:15px">Use this code to verify your email address:</p>
          <p style="font-size:36px;letter-spacing:10px;font-weight:bold;text-align:center;background:#fff;border:1px solid #e8dcc8;border-radius:10px;padding:16px 8px">${code}</p>
          <p style="font-size:13px;color:#8a6d55">The code expires in ${ttlMinutes} minutes. If you didn't request it, you can safely ignore this email.</p>
        </div>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[brevo] send failed (${res.status}): ${body}`);
    return {
      ok: false as const,
      error: "Could not send the verification email. Please try again shortly.",
    };
  }
  return { ok: true as const, devFallback: false };
}
