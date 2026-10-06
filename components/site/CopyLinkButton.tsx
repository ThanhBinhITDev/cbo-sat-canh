"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Sao chép liên kết:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 font-semibold text-primary transition"
      title="Sao chép liên kết"
    >
      {copied ? <Check size={15} /> : <Link2 size={15} />}
      {copied ? "Đã sao chép" : "Sao chép link"}
    </button>
  );
}
