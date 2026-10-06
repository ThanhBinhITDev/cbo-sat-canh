"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/**
 * Bộ lọc danh mục/trạng thái: nút mở + listbox tự dựng
 * (không dùng <select> gốc — theo choice-controls.md).
 */
export default function SelectField({
  name,
  options,
  defaultValue = "",
}: {
  name: string;
  options: SelectOption[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className="select flex items-center justify-between gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown size={16} className="shrink-0 text-ink/70" />
      </button>
      <ul
        role="listbox"
        hidden={!open}
        className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 flex flex-col gap-1 rounded-2xl border border-muted bg-surface p-1 shadow-lg transition duration-150"
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <li
              key={option.value}
              role="option"
              aria-selected={isSelected}
              tabIndex={-1}
              onClick={() => {
                setValue(option.value);
                setOpen(false);
                rootRef.current
                  ?.querySelector("button")
                  ?.blur();
              }}
              className={`cursor-pointer rounded-xl px-3 py-2 text-sm ${
                isSelected
                  ? "font-bold text-primary-dark"
                  : "text-ink/80"
              } hover:bg-muted`}
            >
              {option.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
