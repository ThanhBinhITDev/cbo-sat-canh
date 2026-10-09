/** Định dạng ngày giờ tiếng Việt cho khu vực quản trị. */
const DATE_FMT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const TIME_FMT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_FMT.format(d);
}

export function formatTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return TIME_FMT.format(d);
}

const BYTE_UNITS = ["B", "kB", "MB", "GB", "TB"];

/** Định dạng byte kiểu "0 B", "120 kB", "11,4 MB" (cơ số 1024, số vi-VN). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const maxFractionDigits = unit === 0 ? 0 : value < 100 ? 1 : 0;
  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: maxFractionDigits })} ${BYTE_UNITS[unit]}`;
}
