// Task hour calculation logic for Auvo sync

export const SAO_PAULO_OFFSET = -3; // UTC-3

export interface TaskData {
  taskID: number;
  externalId: string;
  customerDescription: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  taskStatus: number;
  duration: string | null;
  durationDecimal: string | null;
  idUserTo: number;
}

export function getMonthBounds(monthKey: string): { start: Date; end: Date } {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1, -SAO_PAULO_OFFSET, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, -SAO_PAULO_OFFSET, 0, 0));
  return { start, end };
}

export function calculateTaskHours(
  task: TaskData,
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

  // For paused tasks (status 6), use durationDecimal if available
  if (taskStatus === 6 && durationDecimal) {
    const dec = parseFloat(durationDecimal);
    if (!isNaN(dec) && dec > 0) {
      if (checkin >= monthEnd) return { hours: 0, calculation: "Paused task outside month" };
      return {
        hours: Math.round(dec * 100) / 100,
        calculation: `Paused: using durationDecimal=${dec}h`,
      };
    }
  }

  // For completed tasks (status 4/5) with durationDecimal
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
          if (totalMs <= 0) return { hours: dec, calculation: `durationDecimal=${dec}h (no clip needed)` };
          const clipStart = Math.max(checkin.getTime(), monthStart.getTime());
          const clipEnd = Math.min(checkout.getTime(), monthEnd.getTime());
          const ratio = Math.max(0, clipEnd - clipStart) / totalMs;
          const clipped = Math.round(dec * ratio * 100) / 100;
          return {
            hours: clipped,
            calculation: `durationDecimal=${dec}h * ratio=${ratio.toFixed(3)} = ${clipped}h (cross-month)`,
          };
        }
      }
      return { hours: dec, calculation: `durationDecimal=${dec}h` };
    }
  }

  // Fallback: use checkIn/checkOut or checkIn/now
  const ini = new Date(Math.max(checkin.getTime(), monthStart.getTime()));

  let fim: Date;
  if (checkOutDate) {
    const checkout = new Date(checkOutDate);
    if (isNaN(checkout.getTime())) {
      return { hours: 0, calculation: "Invalid checkout date" };
    }
    fim = new Date(Math.min(checkout.getTime(), monthEnd.getTime()));
  } else if (taskStatus === 3) {
    fim = new Date(Math.min(now.getTime(), monthEnd.getTime()));
  } else if (taskStatus === 6) {
    return { hours: 0, calculation: "Paused without durationDecimal (conservative: 0h)" };
  } else {
    return { hours: 0, calculation: `Status ${taskStatus} without checkout` };
  }

  const diffMs = Math.max(0, fim.getTime() - ini.getTime());
  const hours = Math.round((diffMs / 3600000) * 100) / 100;
  return {
    hours,
    calculation: `${ini.toISOString()} to ${fim.toISOString()} = ${hours}h`,
  };
}
