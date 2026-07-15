"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAppStore } from "@/store/useAppStore";
import { AgentThoughtStream } from "@/components/AgentThoughtStream";
import type { AgentTraceData, AppUIMessage } from "@/types";

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="white">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

/** Minimal inline renderer for the model's `**bold**` emphasis. A markdown
 *  library would be a new dependency for one token type — not worth it. */
function renderEmphasis(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((segment, i) =>
    segment.startsWith("**") && segment.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {segment.slice(2, -2)}
      </strong>
    ) : (
      segment
    )
  );
}

/** iMessage-style "typing" indicator: three dots lifting in sequence.
 *  Shown while the server pipeline runs (draft → critic → correction) — in
 *  consumer view the agent trace is hidden, so this is the only feedback. */
function TypingDots() {
  return (
    <span
      className="flex items-center gap-1 py-1"
      role="status"
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-gray-400 animate-[typing-dot_1.2s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

function traceEvents(message: AppUIMessage): AgentTraceData[] {
  return message.parts
    .filter(
      (p): p is { type: "data-agent-trace"; id?: string; data: AgentTraceData } =>
        p.type === "data-agent-trace"
    )
    .map((p) => p.data);
}

export default function AssistantPage() {
  const balance = useAppStore((s) => s.balance);
  const threshold = useAppStore((s) => s.threshold);
  const transactions = useAppStore((s) => s.transactions);
  const creditScore = useAppStore((s) => s.creditScore);
  const setRoutingState = useAppStore((s) => s.setRoutingState);
  // "engineering" exposes the agent trace; "consumer" is the shipped view.
  // Messages only exist client-side, so gating them can't mismatch SSR.
  const engineeringView = useAppStore((s) => s.viewMode) === "engineering";

  // Ref so the transport body closure always reads the latest store values
  const contextRef = useRef({ balance, threshold, creditScore, transactions });
  contextRef.current = { balance, threshold, creditScore, transactions };

  // Transport created once — body is a function so it captures contextRef.current at request time
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ financialContext: contextRef.current }),
      }),
    []
  );

  const { messages, sendMessage, status } = useChat<AppUIMessage>({
    transport,
    // Mirror the server pipeline's lifecycle into the Zustand state engine
    onData: (part) => {
      if (part.type === "data-agent-trace") {
        useAppStore.getState().setRoutingState(part.data.stage);
      }
    },
    onFinish: () => setRoutingState("idle"),
    onError: () => setRoutingState("idle"),
  });

  const [input, setInput] = useState("");
  const isStreaming = status === "streaming" || status === "submitted";
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage({ role: "user", parts: [{ type: "text", text }] });
    setInput("");
  }

  const SUGGESTIONS = [
    "Am I at risk of overdrafting this month?",
    "What's my biggest spending category?",
    "How can I improve my credit score?",
  ];

  const lastMessage = messages[messages.length - 1];

  // The server streams agent-trace parts immediately (flipping status to
  // "streaming"), but withholds the answer text until the critic loop clears.
  // Keep the loader up for that whole window — until real text lands — rather
  // than only during "submitted", so consumer view isn't left staring at a gap.
  const lastAssistantText =
    lastMessage?.role === "assistant"
      ? lastMessage.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("")
      : "";
  const awaitingResponse = isStreaming && !lastAssistantText;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="bg-navy px-4 pt-10 pb-6">
        <h1 className="text-white text-xl font-bold">Ask CampusCash</h1>
        <p className="text-blue-200 text-xs mt-0.5">
          Grounded in your real account data
        </p>
      </header>

      {/* Message list */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Try asking…
            </p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  sendMessage({ role: "user", parts: [{ type: "text", text: s }] });
                }}
                className="text-left text-sm text-gray-600 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("");
          const events = m.role === "assistant" ? traceEvents(m) : [];
          if (!text && events.length === 0) return null;
          const live = isStreaming && m.id === lastMessage?.id;

          return (
            <div
              key={m.id}
              className={`flex flex-col gap-2 ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Live agent ledger renders above the answer bubble —
                  engineering view only; consumers just get the answer */}
              {engineeringView && events.length > 0 && (
                <div className="w-full">
                  <AgentThoughtStream events={events} live={live} />
                </div>
              )}
              {text && (
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "text-white rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
                  }`}
                  style={m.role === "user" ? { backgroundColor: "#F26522" } : {}}
                >
                  {m.role === "assistant" ? renderEmphasis(text) : text}
                </div>
              )}
            </div>
          );
        })}

        {awaitingResponse && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-3 bg-white rounded-2xl rounded-tl-sm shadow-sm">
              {engineeringView ? (
                <span className="text-sm text-gray-400 animate-pulse">
                  Dispatching agent pipeline…
                </span>
              ) : (
                <TypingDots />
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar — sticky inside the phone column's scroll container (the
          old fixed+viewport-centered version drifted right once the dev
          panel docked beside the frame), pinned just above the bottom nav */}
      <div className="sticky bottom-16 z-10 w-full px-4 py-3 bg-app-bg border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances…"
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ "--tw-ring-color": "#0D3B66" } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40"
            style={{ backgroundColor: "#F26522" }}
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
}
