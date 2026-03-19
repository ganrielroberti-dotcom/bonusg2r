import { describe, it, expect } from "vitest";
import { parseTimeString, formatMinutesToHHMM } from "@/lib/hoursImportParser";

describe("parseTimeString", () => {
  it("parses simple HH:MM:SS", () => {
    expect(parseTimeString("00:39:07")).toBeCloseTo(39 + 7 / 60, 1);
  });

  it("parses 'X dias e HH:MM:SS'", () => {
    // 3 dias e 02:19:31 = 72 + 2 = 74 hours + 19min + 31s
    const result = parseTimeString("3 dias e 02:19:31");
    const expected = (74 * 60) + 19 + 31 / 60;
    expect(result).toBeCloseTo(expected, 1);
  });

  it("parses '1 dia e HH:MM:SS'", () => {
    const result = parseTimeString("1 dia e 01:15:26");
    const expected = (25 * 60) + 15 + 26 / 60;
    expect(result).toBeCloseTo(expected, 1);
  });

  it("returns 0 for dash", () => {
    expect(parseTimeString("-")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(parseTimeString("")).toBe(0);
  });
});

describe("formatMinutesToHHMM", () => {
  it("formats correctly", () => {
    expect(formatMinutesToHHMM(97 * 60 + 6)).toBe("97:06");
  });
});
