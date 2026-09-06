import { describe, expect, it } from "vitest";
import { scoreTechnologyAssessment } from "../shared/technologyAssessment";

describe("technology assessment scoring", () => {
  it("returns an optimized 100 score when every dimension is mature", () => {
    const result = scoreTechnologyAssessment({ identity: 4, security: 4, resilience: 4, service: 4, automation: 4 });
    expect(result.score).toBe(100);
    expect(result.maturityLevel).toBe("Optimized");
  });

  it("returns a foundational 0 score when every capability is absent", () => {
    const result = scoreTechnologyAssessment({ identity: 0, security: 0, resilience: 0, service: 0, automation: 0 });
    expect(result.score).toBe(0);
    expect(result.maturityLevel).toBe("Foundational");
    expect(result.recommendations).toHaveLength(3);
  });

  it("prioritizes the three lowest-scoring dimensions", () => {
    const result = scoreTechnologyAssessment({ identity: 4, security: 0, resilience: 1, service: 3, automation: 2 });
    expect(result.score).toBe(50);
    expect(result.maturityLevel).toBe("Developing");
    expect(result.recommendations.map(item => item.dimension)).toEqual(["security", "resilience", "automation"]);
  });
});
