import { z } from "zod";
import { buildSupportContext } from "@/lib/ai/context";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .min(1)
    .max(24),
});

// Google Gemini — free tier (no card required). Tried in order: Google's
// current flash model, then flash-lite as a backup when servers are busy.
const MODELS = [
  process.env.GEMINI_MODEL || "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({
      fallback:
        "Our chat assistant isn't connected yet — it's coming soon! Meanwhile, browse the menu at /menu or write to us.",
    });
  }

  const user = await getCurrentUser();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const rateKey = user ? `chat:${user.id}` : `chat:ip:${ip}`;
  if (!rateLimit(rateKey, 15, 5 * 60 * 1000)) {
    return Response.json(
      { error: "You're sending messages very fast — please wait a few minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid message format." }, { status: 400 });
  }

  // Keep only the most recent turns to stay well inside free-tier limits.
  const history = parsed.data.messages.slice(-12);
  const system = await buildSupportContext(user?.id ?? null);

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  });

  let res: globalThis.Response | null = null;
  let lastStatus = 0;
  for (const model of MODELS) {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: payload,
      }
    );
    if (res.ok) break;
    lastStatus = res.status;
    const detail = await res.text().catch(() => "");
    console.error(`[chat] Gemini ${model} error (${res.status}): ${detail.slice(0, 300)}`);
    res = null;
  }

  if (!res) {
    const message =
      lastStatus === 429
        ? "I'm getting a lot of questions right now (free-tier limit). Please try again in a minute!"
        : "Sorry — I couldn't answer just now. Please try again in a moment.";
    return Response.json({ fallback: message });
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() || "Sorry — I couldn't come up with an answer. Please try rephrasing!";

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
