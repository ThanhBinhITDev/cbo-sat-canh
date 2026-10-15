"use client";

import { useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, Extension, Mark } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Link2Off,
  ImageIcon,
  Minus,
  Undo2,
  Redo2,
} from "lucide-react";
import { uploadArticleImage, imageUrlFromPaste } from "@/lib/admin/upload-image";
import ImageDialog from "./ImageDialog";

/* ------------------------------------------------------------------ *
 * Cỡ chữ theo pt: Mark `fontSize` ghi `<span style="font-size:Npt">`.
 * Danh sách phải khớp với regex trong lib/sanitize.ts.
 * ------------------------------------------------------------------ */

export const FONT_SIZES_PT = [9, 10, 11, 12, 14, 16, 18, 20, 24, 28] as const;

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: number) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const FontSize = Mark.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => {
          const m = /font-size:\s*(\d+)pt/i.exec(el.getAttribute("style") ?? "");
          return m ? Number(m[1]) : null;
        },
        renderHTML: (attrs) =>
          attrs.size ? { style: `font-size: ${attrs.size}pt` } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style*=font-size]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
  addCommands() {
    return {
      setFontSize:
        (size: number) =>
        ({ commands }) =>
          commands.setMark(this.name, { size }),
      unsetFontSize:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    } as Partial<import("@tiptap/react").RawCommands>;
  },
});

/* ------------------------------------------------------------------ *
 * Ảnh có kích thước: thuộc tính `width` (%), ghi `style="width:N%"`.
 * ------------------------------------------------------------------ */

export const IMAGE_WIDTHS = [25, 50, 75, 100] as const;

const SizedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const m = /width:\s*(\d+)%/i.exec(el.getAttribute("style") ?? "");
          return m ? Number(m[1]) : null;
        },
        renderHTML: (attrs) =>
          attrs.width ? { style: `width: ${attrs.width}%; height: auto` } : {},
      },
    };
  },
});

/* ------------------------------------------------------------------ *
 * Phím tắt Ctrl/Cmd+K: mở hộp nhập liên kết.
 * ------------------------------------------------------------------ */

const LinkShortcut = (onOpen: () => void) =>
  Extension.create({
    name: "linkShortcut",
    addKeyboardShortcuts() {
      return {
        "Mod-k": () => {
          onOpen();
          return true;
        },
      };
    },
  });

function ToolbarButton({
  title,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded-lg px-1.5 transition disabled:opacity-35 ${
        active
          ? "bg-primary text-white"
          : "text-ink/65 hover:bg-white hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-wrap items-center gap-0.5">{children}</div>
      <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-ink/40">
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <span className="mx-1 hidden h-8 w-px self-center bg-line sm:block" />;
}

export default function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "Soạn nội dung bài viết…",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(defaultValue);
  const [imageOpen, setImageOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      FontSize,
      SizedImage.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      LinkShortcut(() => promptLink()),
    ],
    content: defaultValue || "",
    editorProps: {
      attributes: { class: "prose-post" },
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const src = imageUrlFromPaste(text);
        if (!src) return false;
        event.preventDefault();
        editor?.chain().focus().setImage({ src, alt: "" }).run();
        return true;
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false;
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return false;
        event.preventDefault();
        setUploading(true);
        void uploadArticleImage(file)
          .then((src) => editor?.chain().focus().setImage({ src, alt: "" }).run())
          .finally(() => setUploading(false));
        return true;
      },
    },
    onUpdate: ({ editor: e }) => setHtml(e.getHTML()),
  });

  const ui = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) {
        return {
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          heading: "p" as "p" | "h2" | "h3",
          fontSize: null as number | null,
          bullet: false,
          ordered: false,
          blockquote: false,
          alignLeft: false,
          alignCenter: false,
          alignRight: false,
          link: false,
          image: false,
          imageWidth: null as number | null,
          canUndo: false,
          canRedo: false,
        };
      }
      const heading = e.isActive("heading", { level: 2 })
        ? "h2"
        : e.isActive("heading", { level: 3 })
          ? "h3"
          : "p";
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        heading: heading as "p" | "h2" | "h3",
        fontSize: (e.getAttributes("fontSize").size as number | undefined) ?? null,
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
        blockquote: e.isActive("blockquote"),
        alignLeft: e.isActive({ textAlign: "left" }),
        alignCenter: e.isActive({ textAlign: "center" }),
        alignRight: e.isActive({ textAlign: "right" }),
        link: e.isActive("link"),
        image: e.isActive("image"),
        imageWidth: (e.getAttributes("image").width as number | undefined) ?? null,
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });

  function promptLink() {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "https://";
    const input = window.prompt("Nhập đường dẫn liên kết:", prev);
    if (input === null) return;
    const url = input.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!url) chain.unsetLink().run();
    else chain.setLink({ href: url }).run();
  }

  const setHeading = (value: string) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (value === "p") chain.setParagraph().run();
    else chain.toggleHeading({ level: value === "h2" ? 2 : 3 }).run();
  };

  const setFontSize = (value: string) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (!value) chain.unsetFontSize().run();
    else chain.setFontSize(Number(value)).run();
  };

  const setImageWidth = (pct: number) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes("image", { width: pct }).run();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <input type="hidden" name={name} value={html} />

      <div className="flex flex-wrap items-end gap-x-2 gap-y-2 border-b border-line bg-muted p-2">
        <ToolbarGroup label="Đoạn">
          <select
            aria-label="Kiểu đoạn văn"
            title="Kiểu đoạn văn"
            disabled={!editor}
            value={ui?.heading ?? "p"}
            onChange={(e) => setHeading(e.target.value)}
            className="h-8 rounded-lg border border-line bg-white px-2 text-sm font-semibold text-ink disabled:opacity-40"
          >
            <option value="p">Đoạn thường</option>
            <option value="h2">Tiêu đề lớn</option>
            <option value="h3">Tiêu đề nhỏ</option>
          </select>
        </ToolbarGroup>

        <ToolbarGroup label="Cỡ chữ">
          <select
            aria-label="Cỡ chữ (pt)"
            title="Cỡ chữ (pt) cho vùng đang chọn"
            disabled={!editor}
            value={ui?.fontSize ? String(ui.fontSize) : ""}
            onChange={(e) => setFontSize(e.target.value)}
            className="h-8 rounded-lg border border-line bg-white px-2 text-sm font-semibold text-ink disabled:opacity-40"
          >
            <option value="">Mặc định</option>
            {FONT_SIZES_PT.map((pt) => (
              <option key={pt} value={pt}>
                {pt} pt
              </option>
            ))}
          </select>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup label="Chữ">
          <ToolbarButton title="Đậm (Ctrl+B)" active={ui?.bold} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton title="Nghiêng (Ctrl+I)" active={ui?.italic} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton title="Gạch chân (Ctrl+U)" active={ui?.underline} disabled={!editor} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton title="Gạch ngang" active={ui?.strike} disabled={!editor} onClick={() => editor?.chain().focus().toggleStrike().run()}>
            <Strikethrough size={16} />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup label="Căn & danh sách">
          <ToolbarButton title="Căn trái" active={ui?.alignLeft} disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton title="Căn giữa" active={ui?.alignCenter} disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton title="Căn phải" active={ui?.alignRight} disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
            <AlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton title="Danh sách chấm" active={ui?.bullet} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton title="Danh sách số" active={ui?.ordered} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton title="Trích dẫn" active={ui?.blockquote} disabled={!editor} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton title="Đường kẻ ngang" disabled={!editor} onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
            <Minus size={16} />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup label="Chèn">
          <ToolbarButton title="Liên kết (Ctrl+K)" active={ui?.link} disabled={!editor} onClick={promptLink}>
            <LinkIcon size={16} />
          </ToolbarButton>
          <ToolbarButton title="Bỏ liên kết" disabled={!editor || !ui?.link} onClick={() => editor?.chain().focus().unsetLink().run()}>
            <Link2Off size={16} />
          </ToolbarButton>
          <ToolbarButton title="Chèn ảnh" disabled={!editor} onClick={() => setImageOpen(true)}>
            <ImageIcon size={16} />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup label="Ảnh đang chọn">
          <select
            aria-label="Kích thước ảnh"
            title="Kích thước ảnh (chọn ảnh trước)"
            disabled={!editor || !ui?.image}
            value={ui?.imageWidth ? String(ui.imageWidth) : "100"}
            onChange={(e) => setImageWidth(Number(e.target.value))}
            className="h-8 rounded-lg border border-line bg-white px-2 text-sm font-semibold text-ink disabled:opacity-40"
          >
            {IMAGE_WIDTHS.map((pct) => (
              <option key={pct} value={pct}>
                {pct}%
              </option>
            ))}
          </select>
        </ToolbarGroup>

        <Divider />

        <ToolbarGroup label="Hoàn tác">
          <ToolbarButton title="Hoàn tác (Ctrl+Z)" disabled={!editor || !ui?.canUndo} onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 size={16} />
          </ToolbarButton>
          <ToolbarButton title="Làm lại (Ctrl+Y)" disabled={!editor || !ui?.canRedo} onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 size={16} />
          </ToolbarButton>
        </ToolbarGroup>

        {uploading && (
          <span className="ml-auto self-center pr-1 text-xs font-semibold text-primary">Đang tải ảnh…</span>
        )}
      </div>

      <div className="rich-editor cursor-text" onClick={() => editor?.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>

      <ImageDialog
        open={imageOpen}
        title="Chèn ảnh vào bài viết"
        onClose={() => setImageOpen(false)}
        onInsert={(url) => {
          editor?.chain().focus().setImage({ src: url, alt: "" }).run();
          setImageOpen(false);
        }}
      />
    </div>
  );
}
