import { describe, it, expect } from "vitest";

// Pure function for testing - mirrors the edge function logic
function calculateTaskHours(
  task: {
    checkInDate: string | null;
    checkOutDate: string | null;
    taskStatus: number;
    durationDecimal: string | null;
  },
  monthStart: Date,
  monthEnd: Date,
  now: Date
): { hours: number; calculation: string } {
  const { checkInDate, checkOutDate, taskStatus, durationDecimal } = task;

  if (!checkInDate) {
    return { hours: 0, calculation: "No check-in date" };
  }

  const checkin = new Date(checkInDate);
  if (isNaN(checkin.getTime())) {
    return { hours: 0, calculation: "Invalid check-in date" };
  }

  // Paused tasks (status 6) with durationDecimal
  if (taskStatus === 6 && durationDecimal) {
    const dec = parseFloat(durationDecimal);
    if (!isNaN(dec) && dec > 0) {
      if (checkin >= monthEnd) return { hours: 0, calculation: "Paused task outside month" };
      return { hours: Math.round(dec * 100) / 100, calculation: `Paused: durationDecimal=${dec}h` };
    }
  }

  // Completed tasks (status 4/5) with durationDecimal
  if ((taskStatus === 4 || taskStatus === 5) && durationDecimal) {
    const dec = parseFloat(durationDecimal);
    if (!isNaN(dec) && dec > 0) {
      const checkout = checkOutDate ? new Date(checkOutDate) : null;
      if (checkout && !isNaN(checkout.getTime())) {
        if (checkout <= monthStart || checkin >= monthEnd) {
          return { hours: 0, calculation: "Completed task outside month window" };
        }
        if (checkin < monthStart || checkout > monthEnd) {
          const totalMs = checkout.getTime() - checkin.getTime();
          if (totalMs <= 0) return { hours: dec, calculation: `durationDecimal=${dec}h` };
          const clipStart = Math.max(checkin.getTime(), monthStart.getTime());
          const clipEnd = Math.min(checkout.getTime(), monthEnd.getTime());
          const ratio = Math.max(0, clipEnd - clipStart) / totalMs;
          const clipped = Math.round(dec * ratio * 100) / 100;
          return { hours: clipped, calculation: `cross-month clipped` };
        }
      }
      return { hours: dec, calculation: `durationDecimal=${dec}h` };
    }
  }

  // Fallback: checkIn/checkOut or checkIn/now
  const ini = new Date(Math.max(checkin.getTime(), monthStart.getTime()));

  let fim: Date;
  if (checkOutDate) {
    const checkout = new Date(checkOutDate);
    if (isNaN(checkout.getTime())) return { hours: 0, calculation: "Invalid checkout" };
    fim = new Date(Math.min(checkout.getTime(), monthEnd.getTime()));
  } else if (taskStatus === 3) {
    fim = new Date(Math.min(now.getTime(), monthEnd.getTime()));
  } else if (taskStatus === 6) {
    return { hours: 0, calculation: "Paused without durationDecimal" };
  } else {
    return { hours: 0, calculation: "No checkout, not active" };
  }

  const diffMs = Math.max(0, fim.getTime() - ini.getTime());
  const hours = Math.round((diffMs / 3600000) * 100) / 100;
  return { hours, calculation: `${hours}h` };
}

describe("Auvo Hours Calculation", () => {
  // Feb 2026 boundaries (UTC, São Paulo offset applied)
  const monthStart = new Date("2026-02-01T03:00:00Z"); // Feb 1 00:00 BRT
  const monthEnd = new Date("2026-03-01T03:00:00Z"); // Mar 1 00:00 BRT

  it("calculates normal OS with check-in and check-out", () => {
    const result = calculateTaskHours(
      {
        checkInDate: "2026-02-05T11:00:00Z", // 08:00 BRT
        checkOutDate: "2026-02-05T17:30:00Z", // 14:30 BRT
        taskStatus: 5,
        durationDecimal: "6.5",
      },
      monthStart,
      monthEnd,
      new Date()
    );
    expect(result.hours).toBe(6.5);
  });

  it("calculates OS without checkout (status CheckedIn=3)", () => {
    const now = new Date("2026-02-10T18:00:00Z"); // 15:00 BRT
    const result = calculateTaskHours(
      {
        checkInDate: "2026-02-10T12:00:00Z", // 09:00 BRT
        checkOutDate: null,
        taskStatus: 3,
        durationDecimal: null,
      },
      monthStart,
      monthEnd,
      now
    );
    expect(result.hours).toBe(6);
  });

  it("calculates paused OS using durationDecimal", () => {
    const result = calculateTaskHours(
      {
        checkInDate: "2026-02-10T12:00:00Z",
        checkOutDate: null,
        taskStatus: 6,
        durationDecimal: "3.75",
      },
      monthStart,
      monthEnd,
      new Date()
    );
    expect(result.hours).toBe(3.75);
  });

  it("clips cross-month OS to current month window", () => {
    // OS starts Jan 29 14:00 BRT, ends Feb 3 10:00 BRT
    // For February: Feb 1 00:00 to Feb 3 10:00 = 58h
    const result = calculateTaskHours(
      {
        checkInDate: "2026-01-29T17:00:00Z", // Jan 29 14:00 BRT
        checkOutDate: "2026-02-03T13:00:00Z", // Feb 3 10:00 BRT
        taskStatus: 5,
        durationDecimal: null, // no durationDecimal, use raw calculation
      },
      monthStart,
      monthEnd,
      new Date()
    );
    expect(result.hours).toBe(58); // Feb 1 00:00 to Feb 3 10:00 = 58h
  });

  it("returns 0 for OS entirely outside the month", () => {
    const result = calculateTaskHours(
      {
        checkInDate: "2026-01-15T12:00:00Z",
        checkOutDate: "2026-01-15T18:00:00Z",
        taskStatus: 5,
        durationDecimal: "6",
      },
      monthStart,
      monthEnd,
      new Date()
    );
    expect(result.hours).toBe(0);
  });

  it("returns 0 for paused OS without durationDecimal (conservative)", () => {
    const result = calculateTaskHours(
      {
        checkInDate: "2026-02-10T12:00:00Z",
        checkOutDate: null,
        taskStatus: 6,
        durationDecimal: null,
      },
      monthStart,
      monthEnd,
      new Date()
    );
    expect(result.hours).toBe(0);
  });

  it("handles OS without check-in", () => {
    const result = calculateTaskHours(
      {
        checkInDate: null,
        checkOutDate: null,
        taskStatus: 1,
        durationDecimal: null,
      },
      monthStart,
      monthEnd,
      new Date()
    );
    expect(result.hours).toBe(0);
  });

  it("clips active OS (no checkout) at month end", () => {
    // OS checked in Feb 28, still active, "now" is March 5
    const now = new Date("2026-03-05T12:00:00Z");
    const result = calculateTaskHours(
      {
        checkInDate: "2026-02-28T15:00:00Z", // Feb 28 12:00 BRT
        checkOutDate: null,
        taskStatus: 3,
        durationDecimal: null,
      },
      monthStart,
      monthEnd,
      now
    );
    // Feb 28 15:00 UTC to Mar 1 03:00 UTC = 12h
    expect(result.hours).toBe(12);
  });

  it("clips cross-month active OS from previous month to current month only", () => {
    // OS checked in Jan 25, still active, "now" is Feb 10
    const now = new Date("2026-02-10T18:00:00Z");
    const result = calculateTaskHours(
      {
        checkInDate: "2026-01-25T12:00:00Z",
        checkOutDate: null,
        taskStatus: 3,
        durationDecimal: null,
      },
      monthStart,
      monthEnd,
      now
    );
    // Should clip start to Feb 1 00:00 BRT (03:00 UTC), end at now
    // Feb 1 03:00 UTC to Feb 10 18:00 UTC = 231h
    expect(result.hours).toBe(231);
  });
});
