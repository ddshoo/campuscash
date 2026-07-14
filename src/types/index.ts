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

/** Lifecycle of a machine-ingested transaction. Seed transactions carry no
 *  status — absence means "categorized by hand, trusted". */
export type TransactionStatus = "raw" | "processing" | "categorized";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: TransactionCategory;
  amount: number; // positive = credit, negative = debit
  /** Only present on transactions that came through the ingestion pipeline. */
  status?: TransactionStatus;
  /** Original processor descriptor, kept for auditability after cleaning. */
  rawDescriptor?: string;
  /** Classifier confidence 0..1 — only set once status is "categorized". */
  confidence?: number;
};

export type UpcomingBill = {
  id: string;
  name: string;
  amount: number;
  /** Full ISO datetime — the shortfall engine reasons in hours, not days. */
  dueDate: string;
  autopay: boolean;
  /** Display string for the account the charge draws from. */
  fundingSource: string;
  /** Set when the user defers the charge from the alert card. */
  snoozed?: boolean;
};

/** Which checkout engine the app routes payments through. "legacy" is the
 *  original external-redirect flow the research flagged for drop-off;
 *  "native" is the rebuilt in-app flow. */
export type PaymentArchitecture = "legacy" | "native";

/** What the app surfaces about its own internals. "consumer" is exactly what
 *  a shipped user would see; "engineering" additionally exposes the agent
 *  pipeline trace and classifier confidence — the interview demo view. */
export type ViewMode = "consumer" | "engineering";

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
