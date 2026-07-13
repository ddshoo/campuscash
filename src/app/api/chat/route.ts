import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateObject,
  generateText,
  jsonSchema,
} from "ai";
import type { UIMessageStreamWriter } from "ai";
import type { AgentTraceData, AppUIMessage, Transaction } from "@/types";

export const maxDuration = 60;

// ── Model tiers ──────────────────────────────────────────────────────────────
// Utility + critic run on Haiku (fast/cheap); deep reasoning stays on the
// project-standard Sonnet. Routing between them is the token-optimization
// story: simple lookups never pay Sonnet prices.
const UTILITY_MODEL = "claude-haiku-4-5";
const DEEP_MODEL = "claude-sonnet-4-5";

type FinancialContext = {
  balance: number;
  threshold: number;
  creditScore: number;
  transactions: Transaction[];
};

type TraceWriter = UIMessageStreamWriter<AppUIMessage>;

// ── Grounding context ────────────────────────────────────────────────────────
// Deliberately feeds ALL transactions verbatim (no slicing, no RAG): user
// testing caught a grounding bug where a truncated context missed an $1,800
// tuition expense. Ten rows is ~400 tokens — full fidelity is cheaper than
// a retrieval mistake.
function renderSnapshot(ctx: FinancialContext): string {
  const rows = ctx.transactions.map((t) => {
    const sign = t.amount > 0 ? "+" : "-";
    return `  • ${t.date}  ${t.description} (${t.category})  ${sign}$${Math.abs(t.amount).toFixed(2)}`;
  });

  return `STUDENT FINANCIAL SNAPSHOT
───────────────────────────
Checking balance:    $${ctx.balance.toFixed(2)}
Low-balance alert:   $${ctx.threshold.toFixed(2)}  (orange banner fires when balance drops below this)
Credit score:        ${ctx.creditScore} (FICO)

TRANSACTIONS (all ${ctx.transactions.length} on record — complete ledger)
${rows.join("\n")}`;
}

function buildSystemPrompt(ctx: FinancialContext): string {
  return `You are CampusCash, a friendly personal finance assistant for college students. You have this student's complete financial data below and must only cite figures that appear in it — never invent numbers.

${renderSnapshot(ctx)}

GUIDELINES
- Ground every number in the snapshot above. If asked about the balance, quote $${ctx.balance.toFixed(2)} exactly.
- If a question cannot be answered from this data, say so honestly.
- Be concise, specific, and encouraging — 3–5 sentences unless more is genuinely needed.
- Avoid financial jargon.`;
}

// Rough char/4 heuristic — good enough for the ticker's token annotations.
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

// ── Intent classification (Step 1) ───────────────────────────────────────────
type Intent = {
  complexity: "simple" | "analytical";
  needsLedgerMath: boolean;
  rationale: string;
};

const intentSchema = jsonSchema<Intent>({
  type: "object",
  properties: {
    complexity: {
      type: "string",
      enum: ["simple", "analytical"],
      description:
        "simple = direct lookup answerable from a single field; analytical = requires aggregation, simulation, projection, or multi-transaction reasoning",
    },
    needsLedgerMath: {
      type: "boolean",
      description:
        "true if answering requires arithmetic across the transaction ledger",
    },
    rationale: { type: "string", description: "one short sentence" },
  },
  required: ["complexity", "needsLedgerMath", "rationale"],
  additionalProperties: false,
});

// ── Critic verification (Step 3) ─────────────────────────────────────────────
type CriticVerdict = {
  grounded: boolean;
  violations: string[];
};

const criticSchema = jsonSchema<CriticVerdict>({
  type: "object",
  properties: {
    grounded: {
      type: "boolean",
      description:
        "true only if every dollar amount, score, and count in the draft is either present in the snapshot or correctly derivable from it",
    },
    violations: {
      type: "array",
      items: { type: "string" },
      description:
        "each fabricated or miscalculated figure, with what the snapshot actually supports",
    },
  },
  required: ["grounded", "violations"],
  additionalProperties: false,
});

// ── Ledger helper ────────────────────────────────────────────────────────────
let traceSeq = 0;
function pushTrace(
  writer: TraceWriter,
  data: Omit<AgentTraceData, "ts">
): void {
  writer.write({
    type: "data-agent-trace",
    id: `trace-${Date.now()}-${traceSeq++}`,
    data: { ...data, ts: Date.now() },
  });
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { messages, financialContext } = (await req.json()) as {
    messages: AppUIMessage[];
    financialContext: FinancialContext;
  };

  const system = buildSystemPrompt(financialContext);
  const modelMessages = await convertToModelMessages(messages);
  const lastUserText = messages
    .filter((m) => m.role === "user")
    .at(-1)
    ?.parts.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ") ?? "";

  const stream = createUIMessageStream<AppUIMessage>({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });

      // ── Step 1: intent parsing (Haiku, structured output) ──
      pushTrace(writer, {
        stage: "parsing",
        level: "routine",
        label: "[INTENT_PARSER] Checking complexity parameters…",
        model: UTILITY_MODEL,
      });

      const { object: intent } = await generateObject({
        model: anthropic(UTILITY_MODEL),
        schema: intentSchema,
        system:
          "Classify the complexity of a personal-finance question against a 10-transaction ledger. Respond with the schema only.",
        prompt: `Ledger context:\n${renderSnapshot(financialContext)}\n\nQuestion: "${lastUserText}"`,
      });

      // ── Step 2: token-optimized routing ──
      const deep = intent.complexity === "analytical" || intent.needsLedgerMath;
      const answerModel = deep ? DEEP_MODEL : UTILITY_MODEL;
      const promptTokens = estimateTokens(system + lastUserText);

      pushTrace(writer, {
        stage: deep ? "deep_reasoning" : "utility_model",
        level: deep ? "deep" : "routine",
        label: deep
          ? "[ROUTER] Triage complete → Invoking Deep Reasoning Engine."
          : "[ROUTER] Triage complete → Fast utility path.",
        detail: `${intent.rationale} (~${promptTokens} tokens in)`,
        model: answerModel,
        tokensIn: promptTokens,
      });

      // ── Draft (not yet streamed — critic gets first look) ──
      const draft = await generateText({
        model: anthropic(answerModel),
        system,
        messages: modelMessages,
      });
      let finalText = draft.text;

      // ── Step 3: critic loop — verify grounding BEFORE rendering ──
      pushTrace(writer, {
        stage: "critic_evaluation",
        level: "deep",
        label: "[CRITIC] Auditing draft figures against the 10-transaction ledger…",
        model: UTILITY_MODEL,
      });

      const { object: verdict } = await generateObject({
        model: anthropic(UTILITY_MODEL),
        schema: criticSchema,
        system:
          "You are a financial grounding auditor. Verify that every figure in the draft is present in, or correctly derived from, the snapshot. Flag anything fabricated or miscalculated.",
        prompt: `SNAPSHOT (ground truth):\n${renderSnapshot(financialContext)}\n\nDRAFT ANSWER:\n${draft.text}`,
      });

      if (!verdict.grounded && verdict.violations.length > 0) {
        // ── Self-correction: one real regeneration with the critic's findings ──
        pushTrace(writer, {
          stage: "self_correction",
          level: "correction",
          label:
            "[CRITIC] Grounding anomaly flagged → Executing self-correction loop…",
          detail: verdict.violations.join("; "),
          model: DEEP_MODEL,
        });

        const corrected = await generateText({
          model: anthropic(DEEP_MODEL),
          system,
          messages: [
            ...modelMessages,
            { role: "assistant" as const, content: draft.text },
            {
              role: "user" as const,
              content: `An automated audit found these grounding problems in your answer: ${verdict.violations.join("; ")}. Rewrite the answer using only figures supported by your snapshot. Return only the corrected answer.`,
            },
          ],
        });
        finalText = corrected.text;
      } else {
        pushTrace(writer, {
          stage: "critic_evaluation",
          level: "routine",
          label: "[CRITIC] All figures verified against ledger. ✓",
        });
      }

      // ── Stream the validated answer ──
      const textId = "answer";
      writer.write({ type: "text-start", id: textId });
      // Chunked writes keep the streaming feel even though the text was
      // fully validated server-side before the first byte went out.
      const words = finalText.split(/(?<=\s)/);
      for (let i = 0; i < words.length; i += 4) {
        writer.write({
          type: "text-delta",
          id: textId,
          delta: words.slice(i, i + 4).join(""),
        });
        await new Promise((r) => setTimeout(r, 12));
      }
      writer.write({ type: "text-end", id: textId });

      pushTrace(writer, {
        stage: "idle",
        level: "routine",
        label: `[PIPELINE] Complete — served by ${answerModel}.`,
        model: answerModel,
      });

      writer.write({ type: "finish" });
    },
    onError: (error) =>
      error instanceof Error ? error.message : "Pipeline error",
  });

  return createUIMessageStreamResponse({ stream });
}
