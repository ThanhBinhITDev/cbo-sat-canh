"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  avatarPath,
  storagePathFromPublicUrl,
  validateAvatarFile,
} from "@/lib/avatar";
import ImageCropper from "./ImageCropper";

const BUCKET = "site-assets";

/**
 * Ô chọn ảnh đại diện có cắt ảnh (khung tròn 1:1) dùng trong form thường:
 * tải ảnh lên bucket `site-assets` rồi ghi URL công khai vào một input ẩn.
 * Dùng cho ảnh đại diện của những bản ghi không có sẵn profile (vd: thành viên đội ngũ).
 */
export default function AvatarUploadField({
  name,
  defaultValue,
  fallbackText = "",
  folder = "team",
}: {
  name: string;
  defaultValue?: string | null;
  fallbackText?: string;
  /** Thư mục trong bucket site-assets (avatars/<folder>/...). */
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<string | null>(defaultValue || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(defaultValue ?? "");

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  function onFilePicked(file: File) {
    setError(null);
    const invalid = validateAvatarFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(URL.createObjectURL(file));
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const path = avatarPath(folder, file.name);
      const { error: up } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (up) throw new Error(up.message);

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const oldPath = storagePathFromPublicUrl(value ?? "");
      if (oldPath && oldPath !== path) {
        await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      setValue(pub.publicUrl);
      setUrlDraft(pub.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải lên được ảnh.");
    } finally {
      setBusy(false);
    }
  }

  function onCropped(file: File) {
    closeCrop();
    void upload(file);
  }

  async function removeAvatar() {
    setError(null);
    setBusy(true);
    try {
      const oldPath = storagePathFromPublicUrl(value ?? "");
      if (oldPath) {
        const supabase = createClient();
        await supabase.storage.from(BUCKET).remove([oldPath]);
      }
      setValue(null);
      setUrlDraft("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name={name} value={value ?? ""} />

      <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-2xl font-black text-primary">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          (fallbackText.slice(0, 1).toUpperCase() || "?")
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/40 text-white">
            <Loader2 size={20} className="animate-spin" />
          </span>
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onFilePicked(f);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="btn btn-ghost !py-2 text-xs disabled:opacity-60"
          >
            <Camera size={15} /> Chọn ảnh &amp; cắt
          </button>
          {value && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void removeAvatar()}
              className="btn !py-2 text-xs text-red-600 hover:border-red-300 disabled:opacity-60"
            >
              <Trash2 size={15} /> Xoá ảnh
            </button>
          )}
        </div>

        <input
          value={urlDraft}
          onChange={(e) => {
            setUrlDraft(e.target.value);
            setValue(e.target.value.trim() || null);
          }}
          placeholder="Hoặc dán đường dẫn ảnh https://..."
          className="input !py-2 text-xs"
          inputMode="url"
        />

        {error && (
          <p className="alert-error !mb-0" role="alert">
            {error}
          </p>
        )}
      </div>

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          title="Cắt ảnh đại diện"
          aspect={1}
          cropShape="round"
          maxDimension={512}
          fileNamePrefix="avatar"
          onCancel={closeCrop}
          onCrop={onCropped}
        />
      )}
    </div>
  );
}
