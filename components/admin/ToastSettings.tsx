"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { BellRing, Save, Play } from "lucide-react";
import { Toggle } from "./ui";
import { saveToast } from "@/lib/admin/actions";
import { submitWithToast } from "@/lib/admin/submit-with-toast";
import { TOAST_POSITIONS, type ToastConfig, type ToastPosition } from "@/lib/toast";

type Props = { initial: ToastConfig };

export default function ToastSettings({ initial }: Props) {
  const [position, setPosition] = useState<ToastPosition>(initial.position);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [successMs, setSuccessMs] = useState(initial.successDurationMs);
  const [errorMs, setErrorMs] = useState(initial.errorDurationMs);

  // Thử thông báo dùng giá trị đang nhập trên form (chưa cần lưu).
  const preview = (kind: "success" | "error") => {
    const clamp = (n: number) => Math.min(15000, Math.max(500, n || 0));
    const opts = {
      position,
      duration: kind === "success" ? clamp(successMs) : clamp(errorMs),
    };
    if (kind === "success") {
      toast.success("Thử thông báo thành công: đã lưu thay đổi.", opts);
    } else {
      toast.error("Thử thông báo lỗi: không lưu được dữ liệu.", opts);
    }
  };

  return (
    <form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void submitWithToast(new FormData(e.currentTarget), saveToast, {
          loading: "Đang lưu thông báo...",
        });
      }}
      className="card p-5"
    >
      <div className="mb-1 flex items-center gap-2">
        <BellRing size={18} className="text-primary" />
        <h2 className="text-base font-bold">Thông báo (Toast)</h2>
      </div>
      <p className="mb-4 text-xs text-ink/60">
        Thông báo nhỏ hiện khi lưu dữ liệu trong quản trị hoặc khi gửi form trên website.
      </p>

      <Toggle
        name="enabled"
        label="Bật thông báo"
        hint="Tắt để không hiện thông báo khi lưu/gửi."
        checked={enabled}
        onChange={setEnabled}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold">Vị trí hiển thị</span>
          <select
            name="position"
            value={position}
            onChange={(e) => setPosition(e.target.value as ToastPosition)}
            disabled={!enabled}
            className="input !py-2 disabled:opacity-50"
          >
            {TOAST_POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold">Thành công (ms)</span>
          <input
            name="successDurationMs"
            type="number"
            min={500}
            max={15000}
            step={100}
            value={successMs}
            onChange={(e) => setSuccessMs(Number(e.target.value))}
            disabled={!enabled}
            className="input !py-2 disabled:opacity-50"
          />
          <span className="text-xs text-ink/55">500 – 15000</span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold">Lỗi (ms)</span>
          <input
            name="errorDurationMs"
            type="number"
            min={500}
            max={15000}
            step={100}
            value={errorMs}
            onChange={(e) => setErrorMs(Number(e.target.value))}
            disabled={!enabled}
            className="input !py-2 disabled:opacity-50"
          />
          <span className="text-xs text-ink/55">500 – 15000</span>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button type="submit" className="btn btn-primary py-2.5 text-sm">
          <Save size={17} /> Lưu thông báo
        </button>
        <button
          type="button"
          onClick={() => preview("success")}
          disabled={!enabled}
          className="btn btn-ghost py-2.5 text-sm disabled:opacity-50"
        >
          <Play size={15} /> Thử thành công
        </button>
        <button
          type="button"
          onClick={() => preview("error")}
          disabled={!enabled}
          className="btn btn-ghost py-2.5 text-sm disabled:opacity-50"
        >
          <Play size={15} /> Thử lỗi
        </button>
        <span className="text-xs text-ink/55">
          Thử thông báo dùng giá trị đang nhập, chưa cần lưu.
        </span>
      </div>
    </form>
  );
}
