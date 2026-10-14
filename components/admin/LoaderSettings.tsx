"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Info,
  Link2,
  LoaderCircle,
  Save,
  Trash2,
  Type,
} from "lucide-react";
import { Toggle } from "./ui";
import { saveLoader } from "@/lib/admin/actions";
import type { LoaderConfig } from "@/lib/loader";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";

type Props = { initial: LoaderConfig };

const GUIDE: { heading: string; items: string[] }[] = [
  {
    heading: "Màn hình chờ là gì?",
    items: [
      "Là lớp phủ toàn trang che nội dung trong lúc website đang xử lý.",
      "Dùng ảnh/GIF động + dòng chữ để khách thấy website đang tải, tránh cảm giác trang bị “đứng”.",
    ],
  },
  {
    heading: "Khi nào loader hiện?",
    items: [
      "Lần đầu khách mở website (giữ đủ thời gian tối thiểu rồi tự ẩn).",
      "Mỗi khi chuyển trang trên website (bấm menu, liên kết…) — chỉ hiện khi việc tải chậm hơn khoảng 0,2 giây.",
      "Mỗi khi lưu trong trang quản trị: thêm/sửa/xóa bài viết, tài khoản, dịch vụ, đối tác…",
    ],
  },
  {
    heading: "Ảnh loader",
    items: [
      "Tải file trực tiếp hoặc dán link (http/https hoặc đường dẫn bắt đầu bằng /).",
      "Nên dùng GIF động (≤ 8MB) hoặc PNG/WEBP (≤ 5MB). Ảnh nền trong suốt hiển thị đẹp nhất.",
      "Ảnh tự thu vừa khung (tối đa 45% chiều cao và 70% chiều ngang màn hình) và giữ đúng tỉ lệ.",
      "Chưa có ảnh mà vẫn bật? Hệ thống hiện vòng xoay mặc định kèm dòng chữ.",
    ],
  },
  {
    heading: "Dòng chữ kèm (tùy chọn)",
    items: [
      "Bật ô gạt rồi nhập nội dung bất kỳ, ví dụ “Đang tải…”, “Vui lòng chờ trong giây lát”.",
      "Tắt ô gạt = chỉ hiện ảnh/vòng xoay, không có chữ. Để trống chữ cũng không hiện.",
      "Tối đa 120 ký tự, chữ nằm ngay dưới ảnh/loader.",
    ],
  },
  {
    heading: "Màu nền, thời gian, tần suất",
    items: [
      "Màu nền: mặc định lấy màu nền website. Bật để tự chọn màu (nên chọn màu tương phản với ảnh và chữ).",
      "Thời gian hiện tối thiểu (ms): giữ loader đủ lâu cho đẹp; đặt 0 để ẩn ngay khi trang tải xong.",
      "Chỉ hiện 1 lần mỗi phiên: bật để khách chỉ thấy loader ở lần mở đầu tiên; các lần chuyển trang và lưu trong quản trị vẫn dùng loader.",
    ],
  },
];

export default function LoaderSettings({ initial }: Props) {
  const [url, setUrl] = useState(initial.imageUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState("");
  const objectUrlRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showText, setShowText] = useState(initial.showText);
  const [customBg, setCustomBg] = useState(!!initial.background);
  const preview = objectUrl || url || "";

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
  };

  return (
    <form action={saveLoader} data-loading-mode="toast" className="card p-5">
      <div className="mb-1 flex items-center gap-2">
        <LoaderCircle size={18} className="text-primary" />
        <h2 className="text-base font-bold">Màn hình chờ (Loader)</h2>
      </div>
      <p className="mb-4 text-xs text-ink/60">
        Hiện lớp phủ toàn trang trong lúc website đang xử lý: mở trang, chuyển trang
        và lưu trong trang quản trị, rồi tự ẩn khi xong. Có thể kèm ảnh/GIF động và
        một dòng chữ tùy chỉnh.
      </p>

      <details
        open
        className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 text-blue-900"
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold marker:content-none">
          <Info size={17} className="shrink-0 text-blue-600" />
          Hướng dẫn chi tiết cách dùng màn hình chờ
          <span className="ms-auto text-xs font-semibold text-blue-700/70">
            Bấm để thu gọn
          </span>
        </summary>
        <div className="space-y-3 border-t border-blue-200/70 px-4 py-4 text-[13px] leading-relaxed">
          {GUIDE.map((block) => (
            <div key={block.heading}>
              <p className="font-bold text-blue-900">{block.heading}</p>
              <ul className="mt-1 list-disc space-y-1 ps-5 marker:text-blue-400">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>

      <div className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-[130px,1fr]">
        <div className="grid h-[84px] w-[130px] shrink-0 place-items-center rounded-xl border border-line bg-muted/60 p-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview nhận cả blob: URL + GIF
            <img src={preview} alt="" className="max-h-16 max-w-full object-contain" />
          ) : (
            <span className="text-[10px] leading-tight text-ink/45">Chưa có ảnh</span>
          )}
        </div>

        <div className="min-w-0 space-y-2.5">
          <label className="flex items-center gap-2">
            <Link2 size={15} className="shrink-0 text-ink/45" />
            <input
              name="imageUrl"
              value={url}
              onChange={(e) => {
                choose(null);
                setUrl(e.target.value);
              }}
              placeholder="https://… hoặc /images/…"
              className="input !py-2 text-sm"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              name="imageFile"
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
          </div>
          <p className="text-[11px] text-ink/45">PNG, JPG, WEBP, GIF (≤ 8MB), AVIF.</p>
        </div>
      </div>

      <Toggle
        name="clearImage"
        label="Bỏ ảnh loader"
        hint="Bật rồi lưu để xóa ảnh đã upload/đường dẫn khỏi loader."
        icon={<Trash2 size={15} className="text-ink/50" />}
        className="mt-3"
      />

      <div className="mt-4 grid gap-3 rounded-2xl border border-line p-4">
        <Toggle
          name="showText"
          label="Hiện dòng chữ kèm loader"
          icon={<Type size={15} className="text-ink/50" />}
          hint="Tắt = chỉ hiện ảnh/vòng xoay, không có chữ."
          checked={showText}
          onChange={setShowText}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Nội dung chữ</span>
          <input
            name="text"
            defaultValue={initial.text}
            disabled={!showText}
            maxLength={120}
            placeholder="Ví dụ: Đang tải, vui lòng chờ trong giây lát…"
            className="input !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="text-xs text-ink/55">
            Tối đa 120 ký tự. Để trống thì không hiện chữ. Ví dụ: “Đang tải…”.
          </span>
        </label>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-primary/50">
          <input
            name="background"
            type="color"
            defaultValue={initial.background ?? "#ffffff"}
            disabled={!customBg}
            className="h-9 w-12 shrink-0 cursor-pointer rounded border border-line bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Màu nền lớp phủ"
          />
          <label
            className={`flex min-w-0 flex-1 items-center justify-between gap-4 ${
              customBg ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">Màu nền lớp phủ</span>
              <span className="mt-0.5 block text-xs text-ink/55">
                Tắt gạt = dùng màu nền website.
              </span>
            </span>
            <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
              <input
                type="checkbox"
                name="customBackground"
                checked={customBg}
                onChange={(e) => setCustomBg(e.target.checked)}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-line transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2" />
              <span className="absolute left-0.5 z-10 h-5 w-5 rounded-full bg-surface shadow transition-transform peer-checked:translate-x-5" />
            </span>
          </label>
        </div>

        <label className="flex flex-col justify-start gap-1.5 text-sm">
          <span className="font-semibold">Thời gian hiện tối thiểu (ms)</span>
          <input
            name="minDurationMs"
            type="number"
            min={0}
            max={5000}
            step={100}
            defaultValue={initial.minDurationMs}
            className="input !py-2"
          />
          <span className="text-xs text-ink/55">0 = ẩn ngay khi trang tải xong.</span>
        </label>
      </div>

      <Toggle
        name="oncePerSession"
        label="Chỉ hiện 1 lần trong mỗi phiên truy cập"
        hint="Bật để khách chỉ thấy loader ở lần mở trang đầu tiên."
        defaultChecked={initial.oncePerSession}
        className="mt-3"
      />

      <Toggle
        name="enabled"
        label="Bật màn hình chờ"
        hint="Tắt để không hiện loader ở mọi nơi."
        defaultChecked={initial.enabled}
        className="mt-3"
      />

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button type="submit" className="btn btn-primary py-2.5 text-sm">
          <Save size={17} /> Lưu loader
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink/55">
          <Trash2 size={13} /> “Bỏ ảnh loader” sẽ xóa file đã upload khỏi kho ảnh khi lưu.
        </span>
      </div>
    </form>
  );
}
