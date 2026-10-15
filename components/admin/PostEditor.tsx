"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Save, ImageIcon, X } from "lucide-react";
import { savePost } from "@/lib/admin/actions";
import { submitWithToast } from "@/lib/admin/submit-with-toast";
import { slugify } from "@/lib/slug";
import { CATEGORY_LABELS, type Post } from "@/lib/types";
import { BackLink, Field } from "./ui";
import RichTextEditor from "./RichTextEditor";
import ImageDialog from "./ImageDialog";

type Props = { post?: Post | null };

export default function PostEditor({ post }: Props) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<{ ok: boolean; message?: string } | null>(null);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState(null);
    const formData = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name && submitter.value) {
      formData.set(submitter.name, submitter.value);
    }
    startTransition(async () => {
      setState(await submitWithToast(formData, savePost, { loading: "Đang lưu bài viết..." }));
    });
  };

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [cover, setCover] = useState(post?.cover_url ?? "");
  const [coverOpen, setCoverOpen] = useState(false);

  const effectiveSlug = useMemo(() => {
    if (slugTouched) return slug;
    return slugify(title);
  }, [slug, slugTouched, title]);

  const isPublished = post?.status === "published";

  return (
    <div className="mb-6">
      <BackLink href="/admin/bai-viet">Quay lại danh sách bài viết</BackLink>

      <h1 className="mt-3 text-2xl font-extrabold">
        {post ? "Chỉnh sửa bài viết" : "Bài viết mới"}
      </h1>

      {state?.ok === false && state.message && (
        <p className="alert-error mt-4" role="alert">
          {state.message}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-5 grid gap-5 lg:grid-cols-[1.6fr,1fr]">
        {post && <input type="hidden" name="id" value={post.id} />}
        <input type="hidden" name="back" value="/admin/bai-viet" />

        {/* ---------------- Cột chính ---------------- */}
        <div className="space-y-4">
          <Field label="Tiêu đề" required>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="Nhập tiêu đề bài viết..."
              className="input !text-lg !font-bold"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr,auto] sm:items-end">
            <Field
              label="Đường dẫn (slug)"
              hint={`Hiển thị tại /tin-tuc/${effectiveSlug || "..."}`}
            >
              <input
                name="slug"
                value={slugTouched ? slug : effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="tu-dong-sinh-tu-tieu-de"
                className="input font-mono !text-sm"
              />
            </Field>

            <button
              type="button"
              onClick={() => {
                setSlugTouched(false);
                setSlug(slugify(title));
              }}
              className="btn btn-ghost mb-0.5 px-4 py-2.5 text-xs"
            >
              Sinh lại từ tiêu đề
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Danh mục" required>
              <select name="category" defaultValue={post?.category ?? "tin-tuc"} className="select">
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Ảnh bìa" hint="Dán URL hoặc tải ảnh lên">
              <input type="hidden" name="cover_url" value={cover} />
              <div className="flex gap-2">
                <input
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  placeholder="https://..."
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => setCoverOpen(true)}
                  className="btn btn-ghost shrink-0 px-3 text-xs"
                >
                  <ImageIcon size={15} /> Tải ảnh
                </button>
              </div>
            </Field>
          </div>

          {cover && (
            <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-line bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- xem trước ảnh bìa từ liên kết ngoài */}
              <img src={cover} alt="Xem trước ảnh bìa" className="aspect-[16/9] w-full object-cover" />
              <button
                type="button"
                onClick={() => setCover("")}
                aria-label="Xoá ảnh bìa"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <Field label="Tóm tắt" hint="Tối đa 220 ký tự — hiển thị ở thẻ danh sách.">
            <textarea
              name="excerpt"
              defaultValue={post?.excerpt ?? ""}
              maxLength={220}
              rows={2}
              placeholder="Mô tả ngắn gọn nội dung bài viết..."
              className="textarea !min-h-[4rem]"
            />
          </Field>

          {/* Trình soạn thảo */}
          <div>
            <span className="field-label">
              Nội dung <span className="text-red-500">*</span>
            </span>
            <RichTextEditor name="content_html" defaultValue={post?.content_html ?? ""} />
            <span className="hint">
              Mẹo: dán liên kết ảnh (Google Drive, Imgur...) vào nội dung để chèn ảnh nhanh.
            </span>
          </div>
        </div>

        {/* ---------------- Cột phụ ---------------- */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/60">
              Xuất bản
            </h2>

            <div className="mb-4 rounded-xl bg-muted p-3 text-sm">
              <p className="mb-1 font-semibold">Trạng thái hiện tại:</p>
              <span className={`badge ${isPublished ? "badge-green" : "badge-yellow"}`}>
                {isPublished ? "Đã xuất bản" : "Nháp"}
              </span>
            </div>

            <label className="mb-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-line p-3">
              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={post?.is_featured ?? false}
                className="mt-1 h-4 w-4 accent-[var(--brand-primary)]"
              />
              <span>
                <span className="block text-sm font-semibold">Nổi bật ở trang chủ</span>
                <span className="block text-xs text-ink/60">
                  Đưa bài vào mục &ldquo;Tin nổi bật&rdquo;
                </span>
              </span>
            </label>

            <div className="grid gap-2">
              <button
                type="submit"
                name="status"
                value="draft"
                disabled={pending}
                className="btn btn-ghost w-full py-2.5 text-sm disabled:opacity-60"
              >
                <Save size={17} /> Lưu nháp
              </button>
              <button
                type="submit"
                name="status"
                value="published"
                disabled={pending}
                className="btn btn-primary w-full py-2.5 text-sm disabled:opacity-60"
              >
                {pending ? "Đang lưu..." : isPublished ? "Cập nhật & xuất bản" : "Xuất bản"}
              </button>
            </div>

            {post && (
              <Link
                href={post.status === "published" ? `/tin-tuc/${post.slug}` : "/tin-tuc"}
                className="mt-3 block text-center text-xs font-semibold text-ink/60 hover:text-primary"
                target="_blank"
              >
                Xem trên trang web →
              </Link>
            )}
          </div>

          <div className="card space-y-4 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink/60">SEO</h2>
            <Field label="SEO title" hint={`${(post?.meta_title ?? "").length}/180 ký tự`}>
              <input
                name="meta_title"
                defaultValue={post?.meta_title ?? ""}
                maxLength={180}
                placeholder="Để trống = dùng tiêu đề bài"
                className="input"
              />
            </Field>
            <Field label="SEO description" hint={`${(post?.meta_description ?? "").length}/320 ký tự`}>
              <textarea
                name="meta_description"
                defaultValue={post?.meta_description ?? ""}
                maxLength={320}
                rows={3}
                placeholder="Mô tả hiển thị trên Google..."
                className="textarea !min-h-[5rem]"
              />
            </Field>
          </div>
        </div>
      </form>

      <ImageDialog
        open={coverOpen}
        title="Chọn ảnh bìa"
        onClose={() => setCoverOpen(false)}
        onInsert={(url) => {
          setCover(url);
          setCoverOpen(false);
        }}
      />
    </div>
  );
}
