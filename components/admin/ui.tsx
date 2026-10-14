import Link from "next/link";
import type { ChangeEvent, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Inbox } from "lucide-react";

export function PageHeader({
  title,
  description,
  action,
  className = "mb-6",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-ink/80">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function Flash({ flash, error }: { flash?: string; error?: string }) {
  if (error) {
    return (
      <p className="alert-error mb-5" role="alert">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        {error}
      </p>
    );
  }
  if (flash) {
    return (
      <p className="alert-ok mb-5" role="status">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        {flash}
      </p>
    );
  }
  return null;
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card overflow-hidden ${className}`}>{children}</div>
  );
}

export function PanelHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-ink/80">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <Inbox size={48} className="mx-auto mb-4 text-primary" />
      <p className="text-sm font-bold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink/80">{description}</p>
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition hover:text-primary"
    >
      ← {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

/**
 * Ô gạt bật/tắt (thay cho checkbox). Dùng uncontrolled mặc định
 * (`defaultChecked`); truyền `checked` + `onChange` để điều khiển.
 */
export function Toggle({
  name,
  label,
  hint,
  icon,
  defaultChecked,
  checked,
  onChange,
  disabled,
  className = "",
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  icon?: ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 transition ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/50"
      } ${className}`}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          {icon}
          {label}
        </span>
        {hint && <span className="mt-0.5 block text-xs font-normal text-ink/55">{hint}</span>}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          name={name}
          disabled={disabled}
          {...(checked === undefined
            ? { defaultChecked }
            : { checked, onChange: (e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked) })}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-line transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed" />
        <span className="absolute left-0.5 z-10 h-5 w-5 rounded-full bg-surface shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
