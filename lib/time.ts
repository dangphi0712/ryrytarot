// Mọi lịch hẹn tính theo múi giờ Việt Nam (UTC+7).
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const BOOKING_WINDOW_DAYS = 14;

export function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00+07:00`));
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

// Chuyển "YYYY-MM-DD" + "HH:MM" (giờ VN) sang ISO UTC
export function vnToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

// Khoảng [start, end) của một ngày theo giờ VN
export function vnDayRange(date: string) {
  const start = Date.parse(`${date}T00:00:00+07:00`);
  return { start: new Date(start).toISOString(), end: new Date(start + DAY_MS).toISOString() };
}

// Hiển thị giờ "HH:MM" theo giờ VN từ chuỗi ISO
export function vnTime(iso: string): string {
  const d = new Date(Date.parse(iso) + VN_OFFSET_MS);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

// Ngày hiện tại theo giờ VN, dạng "YYYY-MM-DD"
export function vnToday(): string {
  return new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

export function vnAddDays(date: string, days: number): string {
  const ms = Date.parse(`${date}T00:00:00+07:00`) + days * DAY_MS;
  return new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10);
}

export function formatDateVi(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}
