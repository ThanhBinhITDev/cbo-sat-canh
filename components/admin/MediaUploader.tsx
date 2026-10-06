"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Link2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toDirectImageUrl } from "@/lib/drive-link";
import { Field } from "./ui";

type Status =
  | { kind: "idle" }
  | { kind: "busy"; text: string }
  | { kind: "ok"; text: string }
  | { kind: "error"; text: string };

const KINDS = [
  { value: "hero", label: "Banner / Hero" },
  { value: "banner", label: "Banner" },
  { value: "decoration", label: "Trang trí" },
  { value: "logo", label: "Logo" },
  { value: "avatar", label: "Ảnh đại diện" },
  { value: "other", label: "Khác" },
];

function safeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-60);
}

export default function MediaUploader({ canManage = false }: { canManage?: boolean }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [kind, setKind] = useState("other");
  const [url, setUrl] = useState("");

  function finish(message: string, ok: boolean) {
    setStatus({ kind: ok ? "ok" : "error", text: message });
    router.refresh();
    setTimeout(() => setStatus({ kind: "idle" }), 6000);
  }

  const effectiveKind = canManage ? kind : "other";

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;

    setStatus({ kind: "busy", text: `Đang tải lên ${list.length} ảnh...` });

    let supabase;
    try {
      supabase = createClient();
    } catch (e) {
      finish(e instanceof Error ? e.message : "Chưa cấu hình Supabase.", false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      finish("Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại.", false);
      return;
    }

    let done = 0;
    for (const file of list) {
      if (!file.type.startsWith("image/")) {
        finish(`"${file.name}" không phải tệp ảnh.`, false);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        finish(`"${file.name}" lớn hơn 5MB.`, false);
        return;
      }

      const path = `uploads/${user.id}/${Date.now()}-${done}-${safeName(file.name)}`;
      const { error } = await supabase.storage
        .from("site-assets")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        finish(`Tải lên thất bại: ${error.message}`, false);
        return;
      }

      const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
      const { error: insertError } = await supabase.from("media").insert({
        kind: effectiveKind,
        storage_path: path,
        public_url: data.publicUrl,
        alt: file.name.replace(/\.[^.]+$/, ""),
        uploaded_by: user.id,
      });

      if (insertError) {
        await supabase.storage.from("site-assets").remove([path]);
        finish(`Không ghi được vào thư viện ảnh: ${insertError.message}`, false);
        return;
      }
      done += 1;
    }

    finish(`Đã tải lên ${done} ảnh.`, true);
  }

  async function addUrl(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = url.trim();
    if (!raw) return;

    setStatus({ kind: "busy", text: "Đang thêm ảnh..." });

    let supabase;
    try {
      supabase = createClient();
    } catch (err) {
      finish(err instanceof Error ? err.message : "Chưa cấu hình Supabase.", false);
      return;
    }

    const direct = toDirectImageUrl(raw);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("media").insert({
      kind: effectiveKind,
      public_url: direct,
      storage_path: null,
      alt: null,
      uploaded_by: user?.id ?? null,
    });

    if (error) finish(`Không thêm được: ${error.message}`, false);
    else {
      setUrl("");
      finish("Đã thêm ảnh vào thư viện.", true);
    }
  }

  return (
    <div className="card mb-5 space-y-5 p-5">
      <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <div>
          <p className="label">Tải ảnh lên</p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void uploadFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInput.current?.click()}
            className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${
              dragging
                ? "border-primary bg-primary/10"
                : "border-line bg-muted hover:border-primary"
            }`}
          >
            <UploadCloud size={34} className="mb-2 text-primary" />
            <p className="text-sm font-bold">Kéo-thả ảnh vào đây, hoặc bấm để chọn</p>
            <p className="mt-1 text-xs text-ink/55">
              PNG, JPG, WEBP · tối đa 5MB mỗi ảnh · lưu vào bucket{" "}
              <code className="font-bold">site-assets</code>
            </p>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) void uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div>
          <p className="label">Thêm ảnh bằng đường dẫn</p>
          <form onSubmit={addUrl} className="space-y-3">
            <Field label="Đường dẫn ảnh" hint="Tự chuyển link Google Drive sang link ảnh trực tiếp">
              <input
                className="input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                required
              />
            </Field>
            <button type="submit" className="btn btn-ghost w-full py-2.5 text-sm">
              <Link2 size={16} /> Thêm vào thư viện
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {canManage ? (
          <label className="flex items-center gap-2 text-sm font-semibold">
            Loại ảnh khi thêm:
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="select !w-auto">
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm font-semibold text-ink/65">
            Ảnh tải lên sẽ được lưu ở loại <span className="font-bold">Khác</span> — chỉ quản trị
            viên đổi loại được.
          </p>
        )}

        {status.kind === "busy" && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink/65">
            <Loader2 size={16} className="animate-spin" /> {status.text}
          </span>
        )}
        {status.kind === "ok" && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <CheckCircle2 size={16} /> {status.text}
          </span>
        )}
        {status.kind === "error" && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
            <XCircle size={16} /> {status.text}
          </span>
        )}
      </div>
    </div>
  );
}
