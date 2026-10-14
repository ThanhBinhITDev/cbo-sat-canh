"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import type { ToastConfig } from "@/lib/toast";

export default function FlashToast({ config }: { config: ToastConfig }) {
  const sp = useSearchParams();
  const last = useRef("");

  useEffect(() => {
    if (!config.enabled) return;
    const flash = sp.get("flash");
    const err = sp.get("err");
    const key = `${flash || ""}|${err || ""}`;
    if (key && key !== last.current) {
      last.current = key;
      if (flash) {
        toast.success(flash, { duration: config.successDurationMs });
      }
      if (err) {
        toast.error(err, { duration: config.errorDurationMs });
      }
    }
  }, [sp, config]);

  return null;
}
