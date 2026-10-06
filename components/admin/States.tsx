import { SearchX, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function ErrorState({
  title = "Không tải được dữ liệu",
  message,
  detail,
}: {
  title?: string;
  message: string;
  detail?: string;
}) {
  return (
    <div className="card px-6 py-12 text-center">
      <SearchX size={48} className="mx-auto mb-4 text-red-400" />
      <p className="text-base font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/80">{message}</p>
      {detail && (
        <pre className="mx-auto mt-4 max-w-xl overflow-x-auto rounded-xl bg-muted p-3 text-left text-xs leading-relaxed text-ink/80">
          {detail}
        </pre>
      )}
      <p className="mt-5 text-xs text-ink/80">
        Tạo file <code className="font-bold">.env.local</code> rồi chạy lại migration
        để màn hình quản trị có dữ liệu.
      </p>
    </div>
  );
}

export function Notice({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="card px-6 py-12 text-center">
      <Inbox size={48} className="mx-auto mb-4 text-primary" />
      <p className="text-base font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/65">{description}</p>
      {children && <div className="mt-5 flex justify-center gap-2">{children}</div>}
    </div>
  );
}
