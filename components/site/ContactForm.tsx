"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle, MessageCircle } from "lucide-react";
import { SERVICE_OPTIONS } from "@/lib/types";
import type { ContactInfo } from "@/lib/types";

type State = "idle" | "sending" | "ok" | "error";

const MAX_MS = 20_000;

export default function ContactForm({
  contact,
  defaultService,
}: {
  contact: ContactInfo;
  defaultService?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(false);

  const zalo = contact.zalo.replace(/\D/g, "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending" || cooldown) return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      service_interest: String(fd.get("service_interest") ?? "").trim(),
      message: String(fd.get("message") ?? "").trim(),
      website: String(fd.get("website") ?? ""), // honeypot
    };

    if (payload.name.length < 2) {
      setState("error");
      setMessage("Vui lòng nhập họ và tên.");
      return;
    }
    if (!/^0\d{9,10}$/.test(payload.phone.replace(/[\s.\-]/g, ""))) {
      setState("error");
      setMessage("Số điện thoại chưa hợp lệ (bắt đầu bằng 0, 10–11 số).");
      return;
    }
    if (payload.message.length < 10) {
      setState("error");
      setMessage("Nội dung câu hỏi cần ít nhất 10 ký tự.");
      return;
    }

    setState("sending");
    setMessage("");

    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), MAX_MS);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      window.clearTimeout(timer);

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message ?? "Có lỗi xảy ra.");
      }

      setState("ok");
      setMessage("Đã gửi. Chúng tôi sẽ liên hệ với bạn sớm nhất.");
      form.reset();
      setCooldown(true);
      window.setTimeout(() => setCooldown(false), 20_000);
    } catch (err) {
      setState("error");
      setMessage(
        err instanceof Error && err.message
          ? err.message
          : "Có lỗi xảy ra. Vui lòng thử lại hoặc gọi 0967.206.095.",
      );
    }
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-[0.95rem] text-ink placeholder:text-ink/40 outline-none transition focus:border-primary focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-primary)_25%,transparent)]";

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Họ và tên <span className="text-red-500">*</span>
            </span>
            <input name="name" type="text" required placeholder="Nguyễn Văn A" className={inputCls} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Số điện thoại <span className="text-red-500">*</span>
            </span>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              required
              placeholder="0912345678"
              className={inputCls}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Email (không bắt buộc)</span>
          <input name="email" type="email" placeholder="ban@email.com" className={inputCls} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">
            Dịch vụ quan tâm <span className="text-red-500">*</span>
          </span>
          <select
            name="service_interest"
            defaultValue={defaultService ?? ""}
            required
            className={inputCls}
          >
            <option value="" disabled>
              — Chọn dịch vụ —
            </option>
            {SERVICE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">
            Nội dung câu hỏi <span className="text-red-500">*</span>
          </span>
          <textarea
            name="message"
            rows={5}
            required
            placeholder="Bạn cần hỗ trợ gì? Chúng tôi sẽ phản hồi trong thời gian sớm nhất."
            className={`${inputCls} resize-y`}
          />
        </label>

        {/* Honeypot — ẩn khỏi người dùng */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />

        {message && (
          <div
            className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
              state === "ok"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-700"
            }`}
            role="status"
          >
            {state === "ok" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}
            {message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={state === "sending" || cooldown}
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "sending" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {state === "sending" ? "Đang gửi..." : cooldown ? "Vui lòng chờ..." : "Gửi câu hỏi"}
          </button>

          <a
            href={`https://zalo.me/${zalo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ borderColor: "#0068FF", color: "#0068FF" }}
          >
            <MessageCircle size={18} /> Nhắn Zalo
          </a>
          <a
            href={contact.fanpage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}
          >
            Messenger
          </a>
        </div>

        <p className="text-xs leading-relaxed text-ink/55">
          Thông tin của bạn được bảo mật tuyệt đối và chỉ dùng để tư vấn dịch vụ.
          Nếu cần hỗ trợ khẩn cấp, gọi ngay{" "}
          <b className="text-primary-dark">{contact.hotline.join(" – ")}</b>.
        </p>
      </form>
    </div>
  );
}
