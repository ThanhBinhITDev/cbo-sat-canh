export type LoadingMode = "overlay" | "toast" | "none";

export function resolveLoadingMode(form: HTMLFormElement | null): LoadingMode {
  if (!form) return "overlay";
  const m = form.getAttribute("data-loading-mode");
  if (m === "toast") return "toast";
  if (m === "none") return "none";
  if (m === "overlay") return "overlay";
  return "overlay";
}
