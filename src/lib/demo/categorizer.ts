import type { MatchKind, TransactionCategory } from "@/types";

/**
 * Rule-based transaction categorizer.
 *
 * Deliberately NOT an LLM call: categorization runs on every injected payload,
 * must be deterministic for the demo, and the domain (card-processor
 * descriptor formats) is regular enough for string rules. The trade-off we'd
 * name in a deep dive: rules are cheap/predictable but brittle on unseen
 * merchants — that's why unmatched payloads fall to a review queue instead
 * of guessing.
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
  /** Which rule tier decided: exact merchant alias, generic keyword, or none. */
  match: MatchKind;
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
};

// ── Merchant aliases (checked before the generic keyword rules) ──────────────

type MerchantAlias = {
  /** Matched against the normalized haystack (see normalizeForAliases). */
  pattern: RegExp;
  /** Canonical token reported as matchedToken in logs and the review UI. */
  merchant: string;
  category: TransactionCategory;
};

/**
 * Folds descriptor punctuation variants onto one canonical token stream so
 * MCDONALDS, MCDONALD'S, MCDONALD’S #1042 and "SQ *STARBUCKS 1234" all hit
 * the same alias. Apostrophes/periods/ampersands drop (AT&T → ATT); hyphens
 * become spaces (T-MOBILE → T MOBILE); whitespace collapses.
 */
function normalizeForAliases(value: string): string {
  return value
    .toUpperCase()
    .replace(/[’'.&]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Known-merchant table, first match wins. Deliberately separate from the
 * generic CATEGORY_RULES so brand coverage can grow without making the
 * keyword regexes unreadable. Ambiguity notes:
 *  - UBER EATS (food) is listed before bare UBER (transport) — order is
 *    load-bearing.
 *  - Bare ambiguous words ("work", "poker") are intentionally absent; they
 *    stay in the review queue unless stronger evidence matches a rule.
 */
const MERCHANT_ALIAS_RULES: MerchantAlias[] = [
  // food
  { pattern: /\bUBER EATS\b/, merchant: "UBER EATS", category: "food" },
  { pattern: /\bMCDONALDS?\b/, merchant: "MCDONALDS", category: "food" },
  { pattern: /\bSTARBUCKS\b/, merchant: "STARBUCKS", category: "food" },
  { pattern: /\bCHIPOTLE\b/, merchant: "CHIPOTLE", category: "food" },
  { pattern: /\bCHICK ?FIL ?A\b/, merchant: "CHICK-FIL-A", category: "food" },
  { pattern: /\bTACO BELL\b/, merchant: "TACO BELL", category: "food" },
  // entertainment
  { pattern: /\bNETFLIX\b/, merchant: "NETFLIX", category: "entertainment" },
  { pattern: /\bSPOTIFY\b/, merchant: "SPOTIFY", category: "entertainment" },
  { pattern: /\bHULU\b/, merchant: "HULU", category: "entertainment" },
  // transport (bare UBER only fires if UBER EATS didn't)
  { pattern: /\bUBER\b/, merchant: "UBER", category: "transport" },
  { pattern: /\bLYFT\b/, merchant: "LYFT", category: "transport" },
  { pattern: /\bSHELL\b/, merchant: "SHELL", category: "transport" },
  { pattern: /\bSPEEDWAY\b/, merchant: "SPEEDWAY", category: "transport" },
  // shopping
  { pattern: /\bAMAZON\b|\bAMZN\b/, merchant: "AMAZON", category: "shopping" },
  { pattern: /\bWAL ?MART\b/, merchant: "WALMART", category: "shopping" },
  { pattern: /\bTARGET\b/, merchant: "TARGET", category: "shopping" },
  // utilities (phone/internet carriers)
  { pattern: /\bVERIZON\b/, merchant: "VERIZON", category: "utilities" },
  { pattern: /\bATT\b/, merchant: "AT&T", category: "utilities" },
  { pattern: /\bT ?MOBILE\b/, merchant: "T-MOBILE", category: "utilities" },
];

/** Ordered by specificity — first match wins. */
const CATEGORY_RULES: CategoryRule[] = [
  { pattern: /\b(PYRL|PAYROLL|DIRECT DEP|WORK.?STUDY)\b/, category: "income" },
  { pattern: /\b(UBER EATS|DOORDASH|GRUBHUB)\b/, category: "food" },
  { pattern: /\b(COFFEE|CAFE|GRILL|PIZZA|DINER|BAKERY|MASALA|ICE CREAM|BOBA|SUSHI|TACO|BURGER|DONUT)\b/, category: "food" },
  { pattern: /\b(UTIL|DTE|ENERGY|WATER|COMCAST|XFINITY)\b/, category: "utilities" },
  { pattern: /\b(SPEEDWAY|SHELL|EXXON|MARATHON|AAATA|LYFT|AMTRAK)\b/, category: "transport" },
  { pattern: /\b(AMAZON|TARGET|WALMART|MARKETPLACE|MKTP)\b/, category: "shopping" },
  { pattern: /\b(NETFLIX|SPOTIFY|HULU|STEAM|CINEMA|AMC)\b/, category: "entertainment" },
  { pattern: /\b(RENT|LEASING|PROPERTY|APTS?)\b/, category: "rent" },
  { pattern: /\b(TUITION|BURSAR|REGISTRAR)\b/, category: "tuition" },
];

export function classifyMerchant(merchant: string): ClassifyResult {
  const haystack = merchant.toUpperCase();

  // Pass 1: exact-merchant aliases on the punctuation-normalized text.
  const normalized = normalizeForAliases(merchant);
  for (const alias of MERCHANT_ALIAS_RULES) {
    if (alias.pattern.test(normalized)) {
      return { category: alias.category, match: "alias", matchedToken: alias.merchant };
    }
  }

  // Pass 2: generic keyword rules.
  for (const rule of CATEGORY_RULES) {
    const match = haystack.match(rule.pattern);
    if (match) {
      return { category: rule.category, match: "keyword", matchedToken: match[0] };
    }
  }

  // No rule fired — park in the review queue rather than guess.
  return { category: "other", match: "none", matchedToken: null };
}

/**
 * Human-readable explanation of a classification decision. Rule tiers are
 * named for what they ARE (an exact merchant table hit, a keyword rule)
 * instead of dressing heuristic weights up as statistical probabilities.
 */
export function matchLabel(result: Pick<ClassifyResult, "match" | "matchedToken">): string {
  switch (result.match) {
    case "alias":
      return `Exact merchant match: ${result.matchedToken}`;
    case "keyword":
      return `Keyword match: ${result.matchedToken}`;
    case "none":
      return "Needs review";
  }
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
