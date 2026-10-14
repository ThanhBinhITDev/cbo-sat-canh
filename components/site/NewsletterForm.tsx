"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { getToastRuntime } from "@/lib/toast-runtime";

export default function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [text, setText] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setStatus("error");
      setText("Email chưa đúng định dạng.");
      return;
    }

    setStatus("loading");
    const t = toast.loading("Đang đăng ký...");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Không đăng ký được.");

      setStatus("ok");
      const okMsg = data?.duplicate
        ? "Bạn đã đăng ký nhận tin rồi. Cảm ơn bạn!"
        : "Đăng ký thành công. Cảm ơn bạn đã đồng hành!";
      setText(okMsg);
      toast.success(okMsg, { id: t, duration: getToastRuntime().successDurationMs });
      setEmail("");
    } catch (err) {
      setStatus("error");
      const errMsg = err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.";
      setText(errMsg);
      toast.error(errMsg, { id: t, duration: getToastRuntime().errorDurationMs });
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Email đăng ký nhận tin</span>
          <Mail
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/45"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") {
                setStatus("idle");
                setText("");
              }
            }}
            placeholder="Email của bạn"
            required
            className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3 text-sm text-ink outline-none transition focus:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn btn-primary !px-5 !py-3 !text-sm disabled:opacity-60"
        >
          {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : null}
          Đăng ký
        </button>
      </div>

      {text && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
            status === "ok" ? "text-emerald-600" : "text-red-500"
          }`}
          role="status"
        >
          {status === "ok" && <CheckCircle2 size={14} />}
          {text}
        </p>
      )}
    </form>
  );
}
