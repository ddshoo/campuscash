import type { UIMessage } from "ai";

export type TransactionCategory =
  | "food"
  | "transport"
  | "entertainment"
  | "shopping"
  | "income"
  | "rent"
  | "utilities"
  | "tuition"
  | "other";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: TransactionCategory;
  amount: number; // positive = credit, negative = debit
};

export type CreditScoreEntry = {
  date: string; // "YYYY-MM"
  score: number;
};

export type UserProfile = {
  name: string;
  school: string;
  year: string;
  accountName: string;
  accountLast4: string;
};

// ── Agentic pipeline (chat route ⇄ AgentThoughtStream) ──────────────────────

/** Lifecycle of the server-side routing engine, mirrored in the Zustand store. */
export type RoutingState =
  | "idle"
  | "parsing"
  | "utility_model"
  | "deep_reasoning"
  | "critic_evaluation"
  | "self_correction";

/** Drives the ticker's status-dot color: mint / amber / crimson. */
export type AgentTraceLevel = "routine" | "deep" | "correction";

/** One entry in the live agent ledger, pushed as an AI SDK data part. */
export type AgentTraceData = {
  stage: RoutingState;
  level: AgentTraceLevel;
  label: string;
  detail?: string;
  model?: string;
  tokensIn?: number;
  ts: number;
};

/** Chat message shape shared by /api/chat and the assistant page —
 *  types the `data-agent-trace` parts end-to-end. */
export type AppUIMessage = UIMessage<unknown, { "agent-trace": AgentTraceData }>;
