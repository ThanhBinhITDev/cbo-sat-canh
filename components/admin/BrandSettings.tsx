"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Save, Trash2 } from "lucide-react";
import { saveBrand } from "@/lib/admin/actions";
import {
  FALLBACK_LOGO_SQUARE,
  FALLBACK_LOGO_WIDE,
  type Brand,
  type BrandField,
} from "@/lib/brand";

type Props = { initial: Brand };

const ROWS: {
  field: BrandField;
  label: string;
  hint: string;
  fallback: string | null;
}[] = [
  {
    field: "logoWide",
    label: "Logo dài (ngang)",
    hint: "Dùng ở header và footer trang khách. Khuyên ảnh ngang, cao khoảng 50–120px.",
    fallback: FALLBACK_LOGO_WIDE,
  },
  {
    field: "logoSquare",
    label: "Logo vuông",
    hint: "Dùng ở khối hero (khi chưa đặt ảnh), sidebar quản trị và trang đăng nhập.",
    fallback: FALLBACK_LOGO_SQUARE,
  },
  {
    field: "faviconLight",
    label: "Favicon — chế độ sáng",
    hint: "Dùng khi trình duyệt đang ở giao diện sáng. Khuyên PNG vuông 32×32.",
    fallback: null,
  },
  {
    field: "faviconDark",
    label: "Favicon — chế độ tối",
    hint: "Dùng khi trình duyệt ở giao diện tối (thường là bản logo màu trắng/đậm cho nền tối).",
    fallback: null,
  },
];

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";

function BrandRow({
  field,
  label,
  hint,
  fallback,
  url,
  onUrl,
}: (typeof ROWS)[number] & {
  url: string;
  onUrl: (v: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState("");
  const objectUrlRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = objectUrl || url || fallback || "";

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const choose = (f: File | null) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = f ? URL.createObjectURL(f) : "";
    setObjectUrl(objectUrlRef.current);
    setFile(f);
    if (!f && inputRef.current) inputRef.current.value = "";
    const el = document.getElementById(`brand-clear-${field}`) as HTMLInputElement | null;
    if (el) el.checked = false;
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-[110px,1fr]">
      <div className="grid h-[72px] w-[110px] shrink-0 place-items-center rounded-xl border border-line bg-muted/60 p-2">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview nhận cả blob: URL
          <img src={preview} alt="" className="max-h-14 max-w-full object-contain" />
        ) : (
          <span className="text-[10px] leading-tight text-ink/45">Chưa có ảnh</span>
        )}
      </div>

      <div className="min-w-0 space-y-2.5">
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className="text-xs text-ink/60">{hint}</p>
        </div>

        <label className="flex items-center gap-2">
          <Link2 size={15} className="shrink-0 text-ink/45" />
          <input
            name={`${field}Url`}
            value={url}
            onChange={(e) => {
              choose(null);
              onUrl(e.target.value);
            }}
            placeholder="https://… hoặc /images/…"
            className="input !py-2 text-sm"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            name={`${field}File`}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => choose(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn btn-ghost !py-2 text-xs"
          >
            <ImagePlus size={14} /> {file ? "Chọn file khác…" : "Chọn file upload…"}
          </button>
          {file && (
            <span className="max-w-[180px] truncate text-xs text-primary-dark">{file.name}</span>
          )}
          <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink/60">
            <input
              id={`brand-clear-${field}`}
              name={`${field}Clear`}
              type="checkbox"
              className="accent-[var(--brand-primary)]"
            />
            Bỏ dùng ảnh này{fallback ? " (về mặc định)" : field.startsWith("favicon") ? " (về /favicon.ico)" : ""}
          </label>
        </div>
        <p className="text-[11px] text-ink/45">PNG, JPG, WEBP, GIF, AVIF · tối đa 5MB.</p>
      </div>
    </div>
  );
}

export default function BrandSettings({ initial }: Props) {
  const [urls, setUrls] = useState<Record<BrandField, string>>(() => ({
    logoWide: initial.logoWide ?? "",
    logoSquare: initial.logoSquare ?? "",
    faviconLight: initial.faviconLight ?? "",
    faviconDark: initial.faviconDark ?? "",
  }));

  return (
    <form action={saveBrand} data-loading-mode="toast" className="card p-5">
      <div className="mb-1 flex items-center gap-2">
        <ImagePlus size={18} className="text-primary" />
        <h2 className="text-base font-bold">Thương hiệu — Logo &amp; Favicon</h2>
      </div>
      <p className="mb-5 text-xs text-ink/60">
        Mỗi mục có 2 cách: dán <b>link ảnh</b> hoặc <b>upload file</b> (file được chọn sẽ ưu
        tiên). Để trống → website dùng ảnh mặc định trong mã nguồn.
      </p>

      <div className="space-y-5">
        {ROWS.map((row) => (
          <BrandRow
            key={row.field}
            {...row}
            url={urls[row.field]}
            onUrl={(v) => setUrls((prev) => ({ ...prev, [row.field]: v }))}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button type="submit" className="btn btn-primary py-2.5 text-sm">
          <Save size={17} /> Lưu thương hiệu
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink/55">
          <Trash2 size={13} /> “Bỏ dùng ảnh này” sẽ xóa file đã upload khỏi kho ảnh
        </span>
      </div>
    </form>
  );
}
