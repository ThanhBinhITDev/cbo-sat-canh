const USERNAME_RE = /^[a-z0-9][a-z0-9_.-]{2,29}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Chuẩn hoá username: bỏ @ đầu, trim, hạ chữ thường. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@+/, "");
}

/** Kiểm tra username. null = hợp lệ (rỗng cũng hợp lệ — username tùy chọn). */
export function validateUsername(username: string): string | null {
  if (!username) return null;
  if (!USERNAME_RE.test(username)) {
    return "Tên đăng nhập 3–30 ký tự: chữ thường, số và dấu . _ -, bắt đầu bằng chữ hoặc số.";
  }
  return null;
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}
