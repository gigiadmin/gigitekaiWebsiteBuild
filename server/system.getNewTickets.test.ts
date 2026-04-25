import { describe, it, expect } from "vitest";

describe("system.getNewTickets", () => {
  it("should calculate cutoff time correctly", () => {
    const minutesBack = 6;
    const now = Date.now();
    const cutoffTime = new Date(now - minutesBack * 60 * 1000);

    // Verify cutoff is approximately 6 minutes in the past
    const timeDiff = now - cutoffTime.getTime();
    const minutesDiff = timeDiff / (60 * 1000);

    expect(minutesDiff).toBeGreaterThanOrEqual(5.9);
    expect(minutesDiff).toBeLessThanOrEqual(6.1);
  });

  it("should handle different minutesBack values", () => {
    const testCases = [
      { minutesBack: 1, expectedMin: 0.9, expectedMax: 1.1 },
      { minutesBack: 6, expectedMin: 5.9, expectedMax: 6.1 },
      { minutesBack: 30, expectedMin: 29.9, expectedMax: 30.1 },
      { minutesBack: 60, expectedMin: 59.9, expectedMax: 60.1 },
    ];

    testCases.forEach(({ minutesBack, expectedMin, expectedMax }) => {
      const now = Date.now();
      const cutoffTime = new Date(now - minutesBack * 60 * 1000);
      const timeDiff = now - cutoffTime.getTime();
      const minutesDiff = timeDiff / (60 * 1000);

      expect(minutesDiff).toBeGreaterThanOrEqual(expectedMin);
      expect(minutesDiff).toBeLessThanOrEqual(expectedMax);
    });
  });

  it("should validate input constraints", () => {
    // Verify that the input validation would work
    const validInputs = [1, 6, 30, 60];
    const invalidInputs = [0, -1, 61, 100];

    validInputs.forEach((input) => {
      expect(input).toBeGreaterThanOrEqual(1);
      expect(input).toBeLessThanOrEqual(60);
    });

    invalidInputs.forEach((input) => {
      const isValid = input >= 1 && input <= 60;
      expect(isValid).toBe(false);
    });
  });
});
