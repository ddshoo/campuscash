import { describe, it, expect } from "vitest";
import {
  parseDescriptor,
  classifyMerchant,
  buildRawVendorDump,
  REVIEW_QUEUE_THRESHOLD,
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
  it("maps food merchants with high confidence", () => {
    const result = classifyMerchant("Student Coffee");
    expect(result.category).toBe("food");
    expect(result.confidence).toBeGreaterThan(0.8);
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
    expect(result.matchedToken).toBeNull();
    expect(result.confidence).toBeLessThan(REVIEW_QUEUE_THRESHOLD);
  });

  it("is deterministic — same input, same confidence, every run", () => {
    const a = classifyMerchant("Student Coffee");
    const b = classifyMerchant("Student Coffee");
    expect(a.confidence).toBe(b.confidence);
  });

  it("never exceeds a confidence of 0.99", () => {
    for (const merchant of ["Payroll Direct Dep", "Netflix", "Tuition Bursar"]) {
      expect(classifyMerchant(merchant).confidence).toBeLessThanOrEqual(0.99);
    }
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
      return classifyMerchant(merchant).confidence < REVIEW_QUEUE_THRESHOLD;
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
