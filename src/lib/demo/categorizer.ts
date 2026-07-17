import type { TransactionCategory } from "@/types";

/**
 * Rule-based transaction categorizer.
 *
 * Deliberately NOT an LLM call: categorization runs on every injected payload,
 * must be deterministic for the demo, and the domain (card-processor
 * descriptor formats) is regular enough for string rules. The trade-off we'd
 * name in a deep dive: rules are cheap/predictable but brittle on unseen
 * merchants — that's why unmatched payloads fall to a low-confidence review
 * queue instead of guessing.
 */

export type RawVendorPayload = {
  /** Untouched processor descriptor, e.g. "SQ *STUDENT COFFEE 0942" */
  descriptor: string;
  amount: number;
  date: string; // YYYY-MM-DD
};

export type ParseStep = {
  op: string; // human-readable operation for the log stream
  result: string; // descriptor after this step
};

export type ParseResult = {
  merchant: string;
  steps: ParseStep[];
};

export type ClassifyResult = {
  category: TransactionCategory;
  confidence: number; // 0..1
  matchedToken: string | null; // which rule token fired (null = review queue)
};

// ── Normalization ─────────────────────────────────────────────────────────────

/** Card-processor prefixes that carry no merchant information. */
const PROCESSOR_PREFIXES: { pattern: RegExp; name: string }[] = [
  { pattern: /^SQ \*/, name: "Square" },
  { pattern: /^TST\*\s?/, name: "Toast POS" },
  { pattern: /^PYPL \*/, name: "PayPal" },
  { pattern: /^VENMO\*/, name: "Venmo" },
  { pattern: /^CKO\*/, name: "Checkout.com" },
];

/** Descriptor fragments some processors abbreviate — expanded for display. */
const MERCHANT_ALIASES: Record<string, string> = {
  SPWY: "Speedway",
  "AMZN MKTP US": "Amazon Marketplace",
  "UBER EATS": "Uber Eats",
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** One noise-stripping pass. Returns null when it has nothing to remove. */
type Transform = (value: string) => { op: string; value: string } | null;

const TRANSFORMS: Transform[] = [
  // Card-processor prefix, e.g. "SQ *", "VENMO*"
  (v) => {
    for (const { pattern, name } of PROCESSOR_PREFIXES) {
      if (pattern.test(v)) {
        return { op: `strip ${name} prefix`, value: v.replace(pattern, "").trim() };
      }
    }
    return null;
  },
  // Trailing alphanumeric ref after "*", e.g. "AMZN MKTP US*2K4XY9"
  (v) => {
    const m = v.match(/\*[A-Z0-9]{4,}$/);
    return m ? { op: "drop trailing ref code", value: v.replace(m[0], "").trim() } : null;
  },
  // Any remaining "*" is a processor field separator, e.g. "UBER *EATS"
  (v) =>
    v.includes("*")
      ? { op: "split processor separator", value: v.replace(/\s?\*\s?/g, " ").replace(/\s{2,}/g, " ").trim() }
      : null,
  // Underscores are field separators in P2P descriptors (VENMO*A_B_99)
  (v) =>
    v.includes("_")
      ? { op: "split underscore fields", value: v.replace(/_/g, " ").trim() }
      : null,
  // Transaction status tokens some processors embed
  (v) =>
    /\bPENDING\b/.test(v)
      ? { op: "drop status token PENDING", value: v.replace(/\bPENDING\b/, "").replace(/\s{2,}/g, " ").trim() }
      : null,
  // Trailing city/state suffix, e.g. " ANN ARBOR MI"
  (v) => {
    const m = v.match(/\s+[A-Z]{2,}(?:\s[A-Z]{2,})*\s+[A-Z]{2}$/);
    if (m && v.replace(m[0], "").trim().length >= 3) {
      return { op: "drop city/state suffix", value: v.replace(m[0], "").trim() };
    }
    return null;
  },
  // Trailing store numbers / terminal ids, e.g. " 0942", " A2"
  (v) => {
    const m = v.match(/(\s\d{2,}|\s[A-Z]\d{1,2})$/);
    return m ? { op: "drop trailing ref code", value: v.replace(m[0], "").trim() } : null;
  },
];

/**
 * Strips processor noise from a raw descriptor, recording every operation so
 * the dev panel can print the pipeline step by step. Exits early the moment
 * the value matches a known merchant alias — later transforms would otherwise
 * mangle multi-word aliases (e.g. "AMZN MKTP US" losing its "US" to the
 * city/state stripper).
 */
export function parseDescriptor(descriptor: string): ParseResult {
  const steps: ParseStep[] = [];
  let value = descriptor.trim().toUpperCase();

  for (const transform of TRANSFORMS) {
    const alias = MERCHANT_ALIASES[value];
    if (alias) {
      steps.push({ op: "expand merchant alias", result: alias.toUpperCase() });
      return { merchant: alias, steps };
    }
    const applied = transform(value);
    if (applied) {
      value = applied.value;
      steps.push({ op: applied.op, result: value });
    }
  }

  const alias = MERCHANT_ALIASES[value];
  if (alias) {
    steps.push({ op: "expand merchant alias", result: alias.toUpperCase() });
    return { merchant: alias, steps };
  }

  return { merchant: titleCase(value), steps };
}

// ── Classification ────────────────────────────────────────────────────────────

type CategoryRule = {
  pattern: RegExp;
  category: TransactionCategory;
  weight: number; // base confidence when this rule fires
};

/** Ordered by specificity — first match wins. */
const CATEGORY_RULES: CategoryRule[] = [
  { pattern: /\b(PYRL|PAYROLL|DIRECT DEP|WORK.?STUDY)\b/, category: "income", weight: 0.97 },
  { pattern: /\b(UBER EATS|DOORDASH|GRUBHUB)\b/, category: "food", weight: 0.94 },
  { pattern: /\b(COFFEE|CAFE|GRILL|PIZZA|DINER|BAKERY|MASALA|ICE CREAM|BOBA|SUSHI|TACO|BURGER|DONUT)\b/, category: "food", weight: 0.91 },
  { pattern: /\b(UTIL|DTE|ENERGY|WATER|COMCAST|XFINITY)\b/, category: "utilities", weight: 0.88 },
  { pattern: /\b(SPEEDWAY|SHELL|EXXON|MARATHON|AAATA|LYFT|AMTRAK)\b/, category: "transport", weight: 0.9 },
  { pattern: /\b(AMAZON|TARGET|WALMART|MARKETPLACE|MKTP)\b/, category: "shopping", weight: 0.92 },
  { pattern: /\b(NETFLIX|SPOTIFY|HULU|STEAM|CINEMA|AMC)\b/, category: "entertainment", weight: 0.93 },
  { pattern: /\b(RENT|LEASING|PROPERTY|APTS?)\b/, category: "rent", weight: 0.9 },
  { pattern: /\b(TUITION|BURSAR|REGISTRAR)\b/, category: "tuition", weight: 0.95 },
];

/** Below this confidence a payload is parked in the review queue as "other". */
export const REVIEW_QUEUE_THRESHOLD = 0.5;

/**
 * Tiny deterministic jitter derived from the merchant string, so repeated
 * demo runs print stable-but-organic confidence values (never Math.random —
 * the log stream should be reproducible run to run).
 */
function confidenceJitter(merchant: string): number {
  let hash = 0;
  for (let i = 0; i < merchant.length; i++) {
    hash = (hash * 31 + merchant.charCodeAt(i)) % 1000;
  }
  return (hash % 50) / 1000; // 0.000 .. 0.049
}

export function classifyMerchant(merchant: string): ClassifyResult {
  const haystack = merchant.toUpperCase();

  for (const rule of CATEGORY_RULES) {
    const match = haystack.match(rule.pattern);
    if (match) {
      const confidence = Math.min(
        0.99,
        rule.weight - confidenceJitter(merchant)
      );
      return { category: rule.category, confidence, matchedToken: match[0] };
    }
  }

  // No rule fired — park in the review queue rather than guess.
  return {
    category: "other",
    confidence: 0.35 + confidenceJitter(merchant),
    matchedToken: null,
  };
}

// ── Demo payload batch ────────────────────────────────────────────────────────

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** The raw dump the dev-panel trigger injects. Dates are relative to "today"
 *  so the feed always looks current in a live demo. */
export function buildRawVendorDump(): RawVendorPayload[] {
  return [
    { descriptor: "SQ *STUDENT COFFEE 0942", amount: -6.4, date: isoDaysAgo(0) },
    { descriptor: "VENMO*ROOMMATE_UTIL_99", amount: -42.5, date: isoDaysAgo(1) },
    { descriptor: "UBER *EATS PENDING 8841", amount: -18.75, date: isoDaysAgo(1) },
    { descriptor: "SPWY 04421 ANN ARBOR MI", amount: -31.2, date: isoDaysAgo(2) },
    { descriptor: "AMZN MKTP US*2K4XY9", amount: -23.99, date: isoDaysAgo(3) },
    { descriptor: "TST* NORTHSIDE GRILL A2", amount: -14.6, date: isoDaysAgo(3) },
    { descriptor: "CKO*ZETA HOUSE DUES S24", amount: -85.0, date: isoDaysAgo(4) },
  ];
}
