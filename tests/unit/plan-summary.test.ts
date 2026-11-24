import { planSummary } from "@/lib/stripe/programs";

describe("planSummary", () => {
  it("shows the monthly price and cadence by default", () => {
    expect(planSummary("foundation")).toBe(
      "MathPivot Foundation — $379/month · 2 sessions/week",
    );
    expect(planSummary("advanced", "monthly")).toBe(
      "MathPivot Advanced — $649/month · 3 sessions/week + monthly one-to-one",
    );
  });

  it("shows the upfront quarterly charge for quarterly plans", () => {
    expect(planSummary("foundation", "quarterly")).toBe(
      "MathPivot Foundation — $1,023.30/quarter · 2 sessions/week",
    );
  });

  it("never mentions the legacy Elite tier", () => {
    for (const tier of ["foundation", "acceleration", "advanced"] as const) {
      expect(planSummary(tier)).not.toMatch(/elite/i);
    }
  });
});
