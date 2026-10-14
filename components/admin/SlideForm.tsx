"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Save } from "lucide-react";
import { saveHeroSlide } from "@/lib/admin/actions";
import { Field } from "@/components/admin/ui";
import ImageCropper from "@/components/admin/ImageCropper";
import type { HeroSlide } from "@/lib/types";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";

export default function SlideForm({
  editing,
  nextOrder,
  count,
}: {
  editing?: HeroSlide;
  nextOrder: number;
  count: number;
}) {
  const [url, setUrl] = useState(editing?.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const objectUrlRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const clearFile = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = "";
    setObjectUrl("");
    setFile(null);
    setUrl("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFilePicked = (f: File | null) => {
    if (!f) return;
    // Mở khung cắt ảnh trước, chưa đặt file vào form.
    const src = URL.createObjectURL(f);
    setCropSrc(src);
  };

  const onCropped = (f: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(f);
    setObjectUrl(objectUrlRef.current);
    setFile(f);
    setCropSrc(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const preview = objectUrl || url;

  const submit = async (fd: FormData) => {
    // File đã cắt nằm trong state (không nằm trong input DOM) → tự append vào FormData.
    if (file) {
      fd.delete("image_file");
      fd.append("image_file", file);
    }
    await saveHeroSlide(fd);
  };

  return (
    <>
      <form action={submit} data-loading-mode="toast" className="space-y-4 p-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <Field
          label="Ảnh slide"
          required={!editing}
          hint="Chọn file → kéo/zoom trong khung 16:7 để cắt. File đã cắt sẽ được lưu; hoặc dán URL ảnh (không cắt)."
        >
          <div className="grid gap-2.5">
            {preview ? (
              <div className="overflow-hidden rounded-xl border border-line bg-muted/40">
                {/* eslint-disable-next-line @next/next/no-img-element -- preview nhận cả blob: URL */}
                <img
                  src={preview}
                  alt="Xem trước ảnh slide"
                  className="aspect-[16/7] w-full object-cover"
                />
              </div>
            ) : (
              <div className="grid aspect-[16/7] place-items-center rounded-xl border border-dashed border-line bg-muted/40 text-xs text-ink/45">
                Chưa có ảnh — chọn file (cắt 16:7) hoặc dán URL
              </div>
            )}

            <label className="flex items-center gap-2">
              <Link2 size={15} className="shrink-0 text-ink/45" />
              <input
                name="image_url"
                value={url}
                onChange={(e) => {
                  clearFile();
                  setUrl(e.target.value);
                }}
                placeholder="https://… hoặc /images/…"
                className="input !py-2 text-sm"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                name="image_file"
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn btn-ghost !py-2 text-xs"
              >
                <ImagePlus size={14} /> {file ? "Chọn file khác…" : "Chọn file & cắt ảnh…"}
              </button>
              {file && (
                <>
                  <span className="max-w-[180px] truncate text-xs text-primary-dark">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-xs text-ink/55 underline hover:text-primary"
                  >
                    Bỏ ảnh
                  </button>
                </>
              )}
            </div>
            <p className="text-[11px] text-ink/45">PNG, JPG, WEBP, GIF, AVIF · tối đa 5MB.</p>
          </div>
        </Field>

        <Field
          label="Mô tả ảnh (alt)"
          hint="Mô tả ngắn nội dung ảnh — hỗ trợ SEO và người dùng trình đọc màn hình."
        >
          <input
            name="alt"
            defaultValue={editing?.alt ?? ""}
            maxLength={300}
            placeholder="Ví dụ: Banner tư vấn xét nghiệm HIV cộng đồng"
            className="input"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Thứ tự">
            <input
              type="number"
              name="sort_order"
              defaultValue={editing?.sort_order ?? nextOrder}
              min={0}
              className="input"
            />
          </Field>
          <label className="mt-6 flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={editing?.is_active ?? true}
              className="h-4 w-4 accent-[var(--brand-primary)]"
            />
            <span className="text-sm font-semibold">Hiển thị trang khách</span>
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="submit" className="btn btn-primary flex-1 py-2.5 text-sm">
            <Save size={16} /> {editing ? "Cập nhật slide" : "Thêm slide"}
          </button>
          <a href="/admin/slider" className="btn btn-ghost py-2.5 text-sm">
            Huỷ
          </a>
        </div>

        {count === 0 && !editing && (
          <p className="text-xs text-ink/55">
            Thêm ít nhất 1 slide để banner chạy trên trang chủ.
          </p>
        )}
      </form>

      {cropSrc && (
        <ImageCropper src={cropSrc} onCancel={() => setCropSrc(null)} onCrop={onCropped} />
      )}
    </>
  );
}
