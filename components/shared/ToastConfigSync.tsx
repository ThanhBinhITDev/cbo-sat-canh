"use client";

import { useEffect } from "react";
import { setToastRuntime } from "@/lib/toast-runtime";
import type { ToastConfig } from "@/lib/toast";

export default function ToastConfigSync({ config }: { config: ToastConfig }) {
  useEffect(() => {
    setToastRuntime(config);
  }, [config]);
  return null;
}
