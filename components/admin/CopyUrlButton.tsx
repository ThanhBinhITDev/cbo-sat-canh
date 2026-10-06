"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Sao chép đường dẫn:", url);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-ink/70 transition hover:border-primary hover:text-primary"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Đã sao chép" : "Copy URL"}
    </button>
  );
}
