export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastConfig = {
  position: ToastPosition;
  /** Thời gian hiện thông báo thành công (ms). */
  successDurationMs: number;
  /** Thời gian hiện thông báo lỗi (ms). */
  errorDurationMs: number;
  /** Bỏ qua chế độ thông báo (không hiện toast khi lưu). */
  enabled: boolean;
};

export const TOAST_POSITIONS: { value: ToastPosition; label: string }[] = [
  { value: "top-left", label: "Trên - trái" },
  { value: "top-center", label: "Trên - giữa" },
  { value: "top-right", label: "Trên - phải" },
  { value: "bottom-left", label: "Dưới - trái" },
  { value: "bottom-center", label: "Dưới - giữa" },
  { value: "bottom-right", label: "Dưới - phải" },
];

export const DEFAULT_TOAST: ToastConfig = {
  position: "top-right",
  successDurationMs: 4000,
  errorDurationMs: 5000,
  enabled: true,
};

const POSITIONS = TOAST_POSITIONS.map((p) => p.value);

export function normalizeToast(input: unknown): ToastConfig {
  const out: ToastConfig = { ...DEFAULT_TOAST };
  if (!input || typeof input !== "object") return out;
  const raw = input as Record<string, unknown>;

  if (typeof raw.position === "string" && POSITIONS.includes(raw.position as ToastPosition)) {
    out.position = raw.position as ToastPosition;
  }
  if (typeof raw.successDurationMs === "number" && raw.successDurationMs >= 500 && raw.successDurationMs <= 15000) {
    out.successDurationMs = Math.round(raw.successDurationMs);
  }
  if (typeof raw.errorDurationMs === "number" && raw.errorDurationMs >= 500 && raw.errorDurationMs <= 15000) {
    out.errorDurationMs = Math.round(raw.errorDurationMs);
  }
  if (typeof raw.enabled === "boolean") out.enabled = raw.enabled;
  return out;
}
