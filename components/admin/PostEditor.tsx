"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  ImageIcon,
  Eye,
  Save,
} from "lucide-react";
import { savePost, type ActionState } from "@/lib/admin/actions";
import { slugify } from "@/lib/slug";
import { CATEGORY_LABELS, type Post } from "@/lib/types";
import { BackLink, Field } from "./ui";

type Props = { post?: Post | null };

const TOOLBAR = [
  { icon: <Bold size={16} />, label: "Đậm", wrap: ["**", "**"] },
  { icon: <Italic size={16} />, label: "Nghiêng", wrap: ["_", "_"] },
  { icon: <Heading2 size={16} />, label: "Tiêu đề", wrap: ["\n## ", ""] },
  { icon: <List size={16} />, label: "Danh sách", wrap: ["\n- ", ""] },
  { icon: <ListOrdered size={16} />, label: "Danh sách số", wrap: ["\n1. ", ""] },
  { icon: <Quote size={16} />, label: "Trích dẫn", wrap: ["\n> ", ""] },
  { icon: <Link2 size={16} />, label: "Liên kết", wrap: ["[", "](https://)"] },
  { icon: <ImageIcon size={16} />, label: "Ảnh", wrap: ["![alt](https://", ")"] },
] as const;

export default function PostEditor({ post }: Props) {
  const [state, formAction, pending] = useActionState<ActionState | null, FormData>(
    savePost,
    null,
  );

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [content, setContent] = useState(post?.content_md ?? "");
  const [preview, setPreview] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const effectiveSlug = useMemo(() => {
    if (slugTouched) return slug;
    return slugify(title);
  }, [slug, slugTouched, title]);

  function wrapSelection(before: string, after: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || "văn bản";
    const next = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + before.length + selected.length;
      el.setSelectionRange(caret, caret);
    });
  }

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

      <form action={formAction} className="mt-5 grid gap-5 lg:grid-cols-[1.6fr,1fr]">
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

            <Field label="Ảnh bìa" hint="Dán URL ảnh (Google Drive hoặc dịch vụ lưu trữ)">
              <input
                name="cover_url"
                defaultValue={post?.cover_url ?? ""}
                placeholder="https://..."
                className="input"
              />
            </Field>
          </div>

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
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="field-label !mb-0">
                Nội dung <span className="text-red-500">*</span>
              </span>
              <div className="flex items-center gap-1">
                <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-muted p-1">
                  {TOOLBAR.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      title={item.label}
                      onClick={() => wrapSelection(item.wrap[0], item.wrap[1])}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink/65 transition hover:bg-white hover:text-primary"
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPreview((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    preview
                      ? "border-primary bg-primary text-white"
                      : "border-line text-ink/70 hover:border-primary hover:text-primary"
                  }`}
                >
                  <Eye size={15} /> {preview ? "Soạn" : "Xem thử"}
                </button>
              </div>
            </div>

            <input type="hidden" name="content_md" value={content} />

            {preview ? (
              <div className="prose-post max-h-[32rem] overflow-y-auto rounded-2xl border border-line bg-muted p-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || "_Chưa có nội dung._"}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                placeholder="Soạn nội dung Markdown ở đây..."
                className="textarea font-mono !text-sm"
              />
            )}
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
    </div>
  );
}
