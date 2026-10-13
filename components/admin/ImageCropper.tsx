"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { X, ZoomIn, ZoomOut } from "lucide-react";

const SLIDE_ASPECT = 16 / 7;

async function getCroppedFile(src: string, area: Area): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, 1));
  const width = Math.round(area.width * scale);
  const height = Math.round(area.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không tạo được canvas.");
  ctx.drawImage(
    image,
    area.x * scale,
    area.y * scale,
    area.width * scale,
    area.height * scale,
    0,
    0,
    width,
    height,
  );
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Không xuất được ảnh."))),
      "image/webp",
      0.9,
    );
  });
  return new File([blob], `slide-crop-${Date.now()}.webp`, { type: "image/webp" });
}

export default function ImageCropper({
  src,
  onCancel,
  onCrop,
}: {
  src: string;
  onCancel: () => void;
  onCrop: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_c: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  const apply = async () => {
    if (!area) return;
    setBusy(true);
    try {
      const file = await getCroppedFile(src, area);
      onCrop(file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cắt ảnh slide"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <p className="text-sm font-bold">Cắt ảnh slide</p>
            <p className="text-xs text-ink/60">Kéo ảnh chọn vùng · tỉ lệ khung 16:7</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng"
            className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/55 hover:border-primary hover:text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative h-[320px] w-full bg-muted sm:h-[380px]">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={SLIDE_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-3 border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            aria-label="Thu nhỏ"
            className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/55 hover:border-primary hover:text-primary"
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range"
            min={1}
            max={4}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[var(--brand-primary)]"
            aria-label="Phóng to ảnh"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            aria-label="Phóng to"
            className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/55 hover:border-primary hover:text-primary"
          >
            <ZoomIn size={16} />
          </button>

          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onCancel} className="btn btn-ghost py-2 text-sm">
              Huỷ
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={busy || !area}
              className="btn btn-primary py-2 text-sm disabled:opacity-60"
            >
              {busy ? "Đang cắt…" : "Áp dụng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
