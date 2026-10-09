"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  avatarPath,
  storagePathFromPublicUrl,
  validateAvatarFile,
} from "@/lib/avatar";

const BUCKET = "site-assets";

export default function AvatarPicker({
  profileId,
  value,
  fullName,
}: {
  profileId: string;
  value: string | null;
  fullName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveAvatar(file: File) {
    setError(null);
    const invalid = validateAvatarFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const path = avatarPath(profileId, file.name);
      const { error: up } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (up) throw new Error(up.message);

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: pub.publicUrl })
        .eq("id", profileId);
      if (dbErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw new Error(dbErr.message);
      }

      const oldPath = storagePathFromPublicUrl(value ?? "");
      if (oldPath && oldPath !== path) {
        await supabase.storage.from(BUCKET).remove([oldPath]);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải lên được ảnh.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAvatar() {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", profileId);
      if (dbErr) throw new Error(dbErr.message);

      const oldPath = storagePathFromPublicUrl(value ?? "");
      if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không xoá được ảnh.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-2xl font-black text-primary">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={fullName} className="h-full w-full object-cover" />
        ) : (
          fullName.slice(0, 1).toUpperCase()
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/40 text-white">
            <Loader2 size={20} className="animate-spin" />
          </span>
        )}
      </span>

      <div className="flex flex-col items-start gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void saveAvatar(f);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="btn btn-ghost !py-2 text-xs disabled:opacity-60"
          >
            <Camera size={15} /> Chọn ảnh
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
        <p className="text-xs text-ink/55">PNG, JPG, WEBP, GIF, AVIF · tối đa 5MB.</p>
        {error && (
          <p className="alert-error !mb-0" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
