/**
 * Time helpers. All schedules are expressed in Indian Standard Time (UTC+05:30).
 */
const IST_OFFSET_MS = 330 * 60 * 1000;

export function istDateString(epochMs: number = Date.now()): string {
  return new Date(epochMs + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Epoch ms for an IST wall-clock date + "HH:MM" time. */
export function departureEpoch(dateStr: string, time: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - IST_OFFSET_MS;
}

export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function isValidDate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !Number.isNaN(Date.parse(dateStr));
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hh, mm] = time.split(":").map(Number);
  const total = (((hh * 60 + mm + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function parseDurationToMinutes(duration: string): number {
  const h = parseInt(duration.split("h")[0] || "0", 10) || 0;
  const m = parseInt((duration.split("h")[1] || "").replace("m", "").trim() || "0", 10) || 0;
  return h * 60 + m;
}
