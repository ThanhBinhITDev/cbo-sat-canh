"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function FlashToast() {
  const sp = useSearchParams();
  const last = useRef("");

  useEffect(() => {
    const flash = sp.get("flash");
    const err = sp.get("err");
    const key = `${flash || ""}|${err || ""}`;
    if (key && key !== last.current) {
      last.current = key;
      if (flash) {
        toast.success(flash, { duration: 4000 });
      }
      if (err) {
        toast.error(err, { duration: 5000 });
      }
    }
  }, [sp]);

  return null;
}
