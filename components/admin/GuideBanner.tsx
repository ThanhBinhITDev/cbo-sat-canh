"use client";

import { Lightbulb, TriangleAlert, X } from "lucide-react";
import { useState } from "react";

export default function GuideBanner({
  bullets,
  note,
}: {
  bullets: string[];
  note: string;
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-muted text-primary">
          <Lightbulb size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-primary-dark">
            Mẹo dùng trang này
          </p>
          <ul className="mt-2 grid list-disc gap-1.5 pl-4 text-sm text-ink/80">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="t-note mt-3">
            <TriangleAlert size={16} className="shrink-0" />
            <span>
              <b>Lưu ý:</b>{` ${note}`}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Ẩn hướng dẫn"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/70 transition hover:bg-muted hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
