"use client";

import { useEffect, useRef, useState } from "react";
import { CakeSlice, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Suggest an eggless cake under ₹500",
  "Where is my order?",
  "What are your delivery charges?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);

    const history: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);

    const appendToReply = (chunk: string) => {
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content + chunk };
        return next;
      });
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as { fallback?: string; error?: string };
        appendToReply(data.fallback ?? data.error ?? "Something went wrong — please try again.");
      } else if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          appendToReply(decoder.decode(value, { stream: true }));
        }
      }
    } catch {
      appendToReply("I couldn't reach the bakery right now — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        size="icon-lg"
        aria-label={open ? "Close chat" : "Chat with us"}
        onClick={() => setOpen((o) => !o)}
        className="fixed right-4 bottom-4 z-50 size-13 rounded-full shadow-lg"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>

      <div
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl transition-all",
          "right-4 bottom-20 left-4 h-[70vh] max-h-[540px] sm:left-auto sm:w-[380px]",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        )}
      >
        <div className="flex items-center gap-2 border-b bg-primary px-4 py-3 text-primary-foreground">
          <CakeSlice className="size-5" />
          <div>
            <p className="text-sm font-semibold">{site.name} assistant</p>
            <p className="text-xs opacity-80">Ask about our menu, orders & delivery</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Hi! I&apos;m the {site.name} assistant. How can I help — cake
                recommendations, order status, delivery questions?
              </p>
              <div className="flex flex-col items-start gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border bg-secondary/60 px-3 py-1.5 text-left text-xs transition-colors hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                  : "mr-auto rounded-bl-sm bg-secondary/70"
              )}
            >
              {m.content ||
                (busy && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </span>
                ) : null)}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            maxLength={2000}
            className="h-9 flex-1 rounded-full border bg-transparent px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send"
            disabled={busy || !input.trim()}
            className="rounded-full"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
