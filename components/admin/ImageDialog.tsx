"use client";

import { useRef, useState } from "react";
import { X, UploadCloud, Link2, Loader2, ImageIcon } from "lucide-react";
import { toDirectImageUrl } from "@/lib/drive-link";
import { uploadArticleImage } from "@/lib/admin/upload-image";

export type ImageDialogProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onInsert: (url: string) => void;
};

export default function ImageDialog({
  open,
  title = "Chèn ảnh",
  onClose,
  onInsert,
}: ImageDialogProps) {
  const [tab, setTab] = useState<"upload" | "link">("upload");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const resolved = toDirectImageUrl(url);

  function reset() {
    setUrl("");
    setError(null);
    setDragging(false);
    setTab("upload");
    setBusy(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const publicUrl = await uploadArticleImage(file);
      reset();
      onInsert(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải ảnh thất bại.");
      setBusy(false);
    }
  }

  function insertLink() {
    if (!resolved) {
      setError("Đường dẫn không phải là liên kết ảnh hợp lệ (http/https).");
      return;
    }
    reset();
    onInsert(resolved);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="text-sm font-bold">{title}</p>
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/55 hover:border-primary hover:text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-line px-5 pt-3">
          {(
            [
              { key: "upload", label: "Tải lên", icon: <UploadCloud size={15} /> },
              { key: "link", label: "Dán liên kết", icon: <Link2 size={15} /> },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setError(null);
              }}
              className={`-mb-px inline-flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-ink/60 hover:text-primary"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "upload" ? (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleFile(file);
                }}
                onClick={() => fileRef.current?.click()}
                className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition ${
                  dragging ? "border-primary bg-primary/10" : "border-line bg-muted hover:border-primary"
                }`}
              >
                {busy ? (
                  <Loader2 size={30} className="mb-2 animate-spin text-primary" />
                ) : (
                  <UploadCloud size={30} className="mb-2 text-primary" />
                )}
                <p className="text-sm font-bold">
                  {busy ? "Đang tải ảnh lên…" : "Kéo-thả ảnh vào đây, hoặc bấm để chọn"}
                </p>
                <p className="mt-1 text-xs text-ink/55">PNG, JPG, WEBP · tối đa 5MB</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="field">
                <span className="field-label">Đường dẫn ảnh</span>
                <input
                  className="input"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  placeholder="https://drive.google.com/file/d/... hoặc https://.../anh.jpg"
                  autoFocus
                />
                <span className="hint">Tự chuyển liên kết Google Drive / Imgur sang ảnh trực tiếp.</span>
              </label>

              <div className="grid min-h-[9rem] place-items-center overflow-hidden rounded-xl border border-line bg-muted">
                {resolved ? (
                  // eslint-disable-next-line @next/next/no-img-element -- xem trước ảnh từ liên kết ngoài
                  <img
                    src={resolved}
                    alt="Xem trước"
                    className="max-h-52 w-full object-contain"
                    onError={() => setError("Không tải được ảnh từ đường dẫn này.")}
                  />
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 text-center text-xs text-ink/50">
                    <ImageIcon size={16} /> Xem trước ảnh sẽ hiện ở đây
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={insertLink}
                disabled={!resolved}
                className="btn btn-primary w-full py-2.5 text-sm disabled:opacity-60"
              >
                <ImageIcon size={16} /> Chèn ảnh
              </button>
            </div>
          )}

          {error && (
            <p className="alert-error mt-3 text-sm" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
