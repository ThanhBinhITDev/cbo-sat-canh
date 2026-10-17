"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Link2 } from "lucide-react";
import { uploadTaskImage } from "@/lib/admin/upload-image";
import ImageCropper from "@/components/admin/ImageCropper";

type Item = { url: string; name: string };

/**
 * Ô đính kèm ảnh nhiệm vụ: chọn ảnh → cắt (khung 16:9) → tải lên → ghi URL
 * vào form ẩn. Danh sách ảnh có sẵn được nạp khi sửa nhiệm vụ.
 */
export default function TaskImageAttachments({
  initial = [],
}: {
  initial?: Item[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>(initial);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropName, setCropName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState("");

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  function onFilePicked(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Tệp đã chọn không phải là ảnh.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh lớn hơn 5MB.");
      return;
    }
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropName(file.name);
    setCropSrc(URL.createObjectURL(file));
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function onCropped(file: File) {
    closeCrop();
    setBusy(true);
    setError(null);
    try {
      const url = await uploadTaskImage(file);
      setItems((prev) => [...prev, { url, name: file.name }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải lên được ảnh.");
    } finally {
      setBusy(false);
    }
  }

  function addUrl() {
    const url = draftUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setError("Đường dẫn phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    setError(null);
    setItems((prev) => [...prev, { url, name: "" }]);
    setDraftUrl("");
  }

  return (
    <div className="space-y-3">
      <p className="field-label">Ảnh đính kèm</p>

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((it, i) => (
            <li
              key={`${it.url}-${i}`}
              className="group relative aspect-video overflow-hidden rounded-xl border border-line bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt={it.name || "Đính kèm"} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Bỏ ảnh"
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-lg bg-black/55 text-white opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void onFilePicked(f);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="btn btn-ghost !py-2 text-xs disabled:opacity-60"
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ImagePlus size={15} />
          )}
          Chọn ảnh &amp; cắt
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            placeholder="Hoặc dán đường dẫn https://..."
            className="input !py-2 text-xs"
            inputMode="url"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!draftUrl.trim()}
            className="btn btn-ghost !py-2 text-xs disabled:opacity-60"
          >
            <Link2 size={14} />
          </button>
        </div>
      </div>

      {error && (
        <p className="alert-error !mb-0" role="alert">
          {error}
        </p>
      )}

      {items.map((it, i) => (
        <Fragment key={`h-${i}-${it.url}`}>
          <input type="hidden" name="attachment_url" value={it.url} />
          <input type="hidden" name="attachment_name" value={it.name} />
        </Fragment>
      ))}

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          title="Cắt ảnh đính kèm"
          aspect={16 / 9}
          cropShape="rect"
          maxDimension={1600}
          fileNamePrefix={cropName ? cropName.replace(/\.[^.]+$/, "") : "task"}
          onCancel={closeCrop}
          onCrop={(f) => void onCropped(f)}
        />
      )}
    </div>
  );
}
