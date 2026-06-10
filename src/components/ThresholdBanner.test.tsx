import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThresholdBanner } from "./ThresholdBanner";

// next/link is a server-side module — replace with a plain anchor for tests
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("ThresholdBanner", () => {
  it("renders when balance is below threshold", () => {
    render(<ThresholdBanner balance={100} threshold={200} />);
    expect(screen.getByText("Low Balance Alert")).toBeInTheDocument();
  });

  it("does not render when balance is above threshold", () => {
    render(<ThresholdBanner balance={500} threshold={200} />);
    expect(screen.queryByText("Low Balance Alert")).not.toBeInTheDocument();
  });

  it("does not render when balance equals threshold", () => {
    render(<ThresholdBanner balance={200} threshold={200} />);
    expect(screen.queryByText("Low Balance Alert")).not.toBeInTheDocument();
  });

  it("links to /balance/alerts", () => {
    render(<ThresholdBanner balance={50} threshold={200} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/balance/alerts");
  });

  it("shows the threshold amount in the subtitle", () => {
    render(<ThresholdBanner balance={50} threshold={200} />);
    expect(screen.getByText(/\$200\.00/)).toBeInTheDocument();
  });
});
