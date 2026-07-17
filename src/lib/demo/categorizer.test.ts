import { describe, it, expect } from "vitest";
import {
  parseDescriptor,
  classifyMerchant,
  buildRawVendorDump,
  matchLabel,
} from "./categorizer";

describe("parseDescriptor — noise stripping", () => {
  it("strips a Square prefix and trailing store number", () => {
    const result = parseDescriptor("SQ *STUDENT COFFEE 0942");
    expect(result.merchant).toBe("Student Coffee");
    expect(result.steps.map((s) => s.op)).toContain("strip Square prefix");
  });

  it("splits Venmo underscore fields and drops the trailing ref", () => {
    const result = parseDescriptor("VENMO*ROOMMATE_UTIL_99");
    expect(result.merchant).toBe("Roommate Util");
  });

  it("expands the Amazon alias before the city/state stripper can mangle it", () => {
    const result = parseDescriptor("AMZN MKTP US*2K4XY9");
    expect(result.merchant).toBe("Amazon Marketplace");
  });

  it("drops embedded status tokens and processor separators", () => {
    const result = parseDescriptor("UBER *EATS PENDING 8841");
    expect(result.merchant).toBe("Uber Eats");
  });

  it("drops a trailing city/state suffix and expands store-code aliases", () => {
    const result = parseDescriptor("SPWY 04421 ANN ARBOR MI");
    expect(result.merchant).toBe("Speedway");
  });

  it("records every operation for the log stream", () => {
    const result = parseDescriptor("SQ *STUDENT COFFEE 0942");
    expect(result.steps.length).toBeGreaterThan(0);
    for (const step of result.steps) {
      expect(step.op).toBeTruthy();
      expect(step.result).toBeTruthy();
    }
  });

  it("leaves an already-clean descriptor intact", () => {
    const result = parseDescriptor("Netflix");
    expect(result.merchant).toBe("Netflix");
    expect(result.steps).toHaveLength(0);
  });
});

describe("classifyMerchant — rule matching", () => {
  it("maps food merchants via a keyword rule", () => {
    const result = classifyMerchant("Student Coffee");
    expect(result.category).toBe("food");
    expect(result.match).toBe("keyword");
    expect(result.matchedToken).toBe("COFFEE");
  });

  it("maps utility descriptors", () => {
    expect(classifyMerchant("Roommate Util").category).toBe("utilities");
  });

  it("maps transport, shopping and delivery merchants", () => {
    expect(classifyMerchant("Speedway").category).toBe("transport");
    expect(classifyMerchant("Amazon Marketplace").category).toBe("shopping");
    expect(classifyMerchant("Uber Eats").category).toBe("food");
  });

  it("parks unknown merchants in the review queue instead of guessing", () => {
    const result = classifyMerchant("Zeta House Dues");
    expect(result.category).toBe("other");
    expect(result.match).toBe("none");
    expect(result.matchedToken).toBeNull();
  });

  it("is deterministic — same input, same result, every run", () => {
    const a = classifyMerchant("Student Coffee");
    const b = classifyMerchant("Student Coffee");
    expect(a).toEqual(b);
  });
});

describe("matchLabel — explainable rule labels", () => {
  it("labels alias hits as exact merchant matches with the token", () => {
    expect(matchLabel(classifyMerchant("Starbucks"))).toBe(
      "Exact merchant match: STARBUCKS"
    );
  });

  it("labels keyword hits with the token that fired", () => {
    expect(matchLabel(classifyMerchant("Campus Burger Co"))).toBe(
      "Keyword match: BURGER"
    );
  });

  it("labels unmatched merchants as needing review", () => {
    expect(matchLabel(classifyMerchant("Zeta House Dues"))).toBe("Needs review");
  });
});

describe("classifyMerchant — merchant alias table", () => {
  const ALIAS_EXPECTATIONS: [input: string, category: string, token: string][] = [
    // food
    ["McDonalds", "food", "MCDONALDS"],
    ["Starbucks", "food", "STARBUCKS"],
    ["Chipotle", "food", "CHIPOTLE"],
    ["Chick-fil-A", "food", "CHICK-FIL-A"],
    ["Taco Bell", "food", "TACO BELL"],
    // entertainment
    ["Netflix", "entertainment", "NETFLIX"],
    ["Spotify", "entertainment", "SPOTIFY"],
    ["Hulu", "entertainment", "HULU"],
    // transport
    ["Uber", "transport", "UBER"],
    ["Lyft", "transport", "LYFT"],
    ["Shell", "transport", "SHELL"],
    ["Speedway", "transport", "SPEEDWAY"],
    // shopping
    ["Amazon", "shopping", "AMAZON"],
    ["Walmart", "shopping", "WALMART"],
    ["Target", "shopping", "TARGET"],
    // utilities
    ["Verizon", "utilities", "VERIZON"],
    ["AT&T", "utilities", "AT&T"],
    ["T-Mobile", "utilities", "T-MOBILE"],
  ];

  it.each(ALIAS_EXPECTATIONS)(
    "classifies %s as %s via alias token %s",
    (input, category, token) => {
      const result = classifyMerchant(input);
      expect(result.category).toBe(category);
      expect(result.matchedToken).toBe(token);
      expect(result.match).toBe("alias");
    }
  );

  it("handles possessives, punctuation, store numbers and processor noise", () => {
    // straight and curly apostrophes, possessive form
    expect(classifyMerchant("MCDONALD'S").category).toBe("food");
    expect(classifyMerchant("MCDONALD’S").category).toBe("food");
    // store number suffix
    expect(classifyMerchant("MCDONALD'S #1042").category).toBe("food");
    // raw descriptor with a processor prefix, unparsed
    expect(classifyMerchant("SQ *STARBUCKS 1234").category).toBe("food");
    // hyphen/spacing variants
    expect(classifyMerchant("TMOBILE PAYMENT").category).toBe("utilities");
    expect(classifyMerchant("T MOBILE").category).toBe("utilities");
    expect(classifyMerchant("CHICKFILA 00821").category).toBe("food");
    expect(classifyMerchant("WAL-MART SUPERCENTER").category).toBe("shopping");
    expect(classifyMerchant("ATT BILL PAYMENT").category).toBe("utilities");
  });

  it("Uber Eats stays food while bare Uber is transport (order-dependent)", () => {
    expect(classifyMerchant("UBER EATS").category).toBe("food");
    expect(classifyMerchant("UBER TRIP HELP.UBER.COM").category).toBe("transport");
  });

  it("keeps ambiguous terms in the review queue without stronger evidence", () => {
    for (const ambiguous of ["work", "poker", "Chuck E Cheese"]) {
      const result = classifyMerchant(ambiguous);
      expect(result.category).toBe("other");
      expect(result.match).toBe("none");
      expect(result.matchedToken).toBeNull();
    }
    // "work" WITH stronger evidence still classifies via the generic rules
    expect(classifyMerchant("UMICH WORK-STUDY PYRL").category).toBe("income");
  });

  it("alias matches are deterministic across runs", () => {
    const a = classifyMerchant("MCDONALD'S #1042");
    const b = classifyMerchant("MCDONALD'S #1042");
    expect(a).toEqual(b);
    expect(a.match).toBe("alias");
  });
});

describe("buildRawVendorDump — demo batch integrity", () => {
  it("every payload parses to a non-empty merchant", () => {
    for (const payload of buildRawVendorDump()) {
      expect(parseDescriptor(payload.descriptor).merchant.length).toBeGreaterThan(2);
    }
  });

  it("exactly one payload lands in the review queue (the demo edge case)", () => {
    const queued = buildRawVendorDump().filter((p) => {
      const { merchant } = parseDescriptor(p.descriptor);
      return classifyMerchant(merchant).match === "none";
    });
    expect(queued).toHaveLength(1);
  });

  it("payload dates are ISO and not in the future", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const payload of buildRawVendorDump()) {
      expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(payload.date <= today).toBe(true);
    }
  });
});
